from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import get_user_model, authenticate
from accounts.serializers import (
    UserRegisterSerializer, UserLoginSerializer, UserSerializer,
    UserDetailSerializer, UserProfileUpdateSerializer,
    UserPasswordChangeSerializer, AuditLogSerializer
)
from accounts.models import AuditLog
from employees.models import EmployeeProfile
from employees.serializers import EmployeeProfileSerializer
from core.permissions import IsAuthenticated, IsOwnerOrReadOnly
from core.pagination import StandardResultsSetPagination
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for user management"""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['email', 'full_name', 'employee_id', 'designation']
    ordering_fields = ['created_at', 'full_name']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        import secrets
        password = self.request.data.get('password')
        if not password:
            password = secrets.token_urlsafe(8) + "Aa1!"
            
        user = serializer.save()
        user.set_password(password)
        user.save()
        
        # Dispatch Credentials email asynchronously
        from notifications.tasks import dispatch_email
        dispatch_email('send_credentials_email', user.email, user.full_name or user.username, user.email, password)
    
    def get_serializer_class(self):
        if self.action == 'register':
            return UserRegisterSerializer
        elif self.action == 'login':
            return UserLoginSerializer
        elif self.action == 'retrieve' or self.action == 'profile':
            return UserDetailSerializer
        elif self.action == 'update_profile':
            return UserProfileUpdateSerializer
        elif self.action == 'change_password':
            return UserPasswordChangeSerializer
        return UserSerializer
    
    def get_permissions(self):
        if self.action in ['register', 'login', 'forgot_password', 'reset_password']:
            return [permissions.AllowAny()]
        elif self.action in ['update_profile', 'profile', 'change_password']:
            return [permissions.IsAuthenticated()]
        
        # Restrict standard CRUD operations (list, retrieve, create, update, destroy) to Admins/HR
        from core.permissions import IsHR, IsAdmin
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), (IsHR | IsAdmin)()]
            
        return [permissions.IsAuthenticated()]
        
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def forgot_password(self, request):
        """Request a password reset token"""
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'message': 'If a user with this email exists, a password reset code has been sent.',
                'token': 'MOCKED_TOKEN'
            }, status=status.HTTP_200_OK)
            
        import random
        from django.utils import timezone
        
        # Generate 6-digit random token
        token = str(random.randint(100000, 999999))
        user.reset_token = token
        user.reset_token_expires_at = timezone.now() + timezone.timedelta(hours=1)
        user.save()
        
        # Dispatch password reset email via real Gmail SMTP
        from notifications.tasks import dispatch_email
        dispatch_email('send_password_reset_email', user.email, user.full_name or user.username, token)
        
        # Log audit
        AuditLog.objects.create(
            user=user,
            action='update',
            model_name='User',
            object_id=user.id,
            ip_address=self.get_client_ip(request),
            changes={'action': 'request_password_reset'}
        )
        
        return Response({
            'message': 'If a user with this email exists, a password reset code has been sent.',
            'token': token
        }, status=status.HTTP_200_OK)
        
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def reset_password(self, request):
        """Reset password using token"""
        email = request.data.get('email')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        new_password_confirm = request.data.get('new_password_confirm')
        
        if not email or not token or not new_password or not new_password_confirm:
            return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        if new_password != new_password_confirm:
            return Response({'error': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)
            
        from django.utils import timezone
        
        try:
            user = User.objects.get(
                email=email,
                reset_token=token,
                reset_token_expires_at__gt=timezone.now()
            )
        except User.DoesNotExist:
            return Response({'error': 'Invalid or expired password reset code.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expires_at = None
        user.save()
        
        # Log audit
        AuditLog.objects.create(
            user=user,
            action='update',
            model_name='User',
            object_id=user.id,
            ip_address=self.get_client_ip(request),
            changes={'action': 'reset_password_success'}
        )
        
        return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register(self, request):
        """User registration endpoint (Disabled)"""
        return Response(
            {'error': 'Public registration is disabled. Please contact your HR department or System Administrator.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def login(self, request):
        """User login endpoint"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        login_input = serializer.validated_data.get('email')
        password = serializer.validated_data.get('password')
        
        # First check if user exists by email or employee_id
        user_by_email = User.objects.filter(email=login_input).first()
        user_by_empid = User.objects.filter(employee_id=login_input).first()
        user = user_by_email or user_by_empid
        
        if not user:
            if '@' in login_input:
                return Response(
                    {'error': 'No account exists with this email address.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            else:
                return Response(
                    {'error': 'No account exists with this Employee ID.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        # Authenticate password
        if not user.check_password(password):
            return Response(
                {'error': 'The password you entered is incorrect.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.is_active:
            return Response(
                {'error': 'Account is inactive'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Log audit
        AuditLog.objects.create(
            user=user,
            action='login',
            model_name='User',
            object_id=user.id,
            ip_address=self.get_client_ip(request)
        )
        
        return Response({
            'message': 'Login successful',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserDetailSerializer(user).data
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        """User logout endpoint"""
        user = request.user
        
        # Log audit
        AuditLog.objects.create(
            user=user,
            action='logout',
            model_name='User',
            object_id=user.id,
            ip_address=self.get_client_ip(request)
        )
        
        return Response(
            {'message': 'Logout successful'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def profile(self, request):
        """Get current user profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put'], permission_classes=[permissions.IsAuthenticated])
    def update_profile(self, request):
        """Update current user profile"""
        user = request.user
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Log audit
        AuditLog.objects.create(
            user=user,
            action='update',
            model_name='User',
            object_id=user.id,
            ip_address=self.get_client_ip(request),
            changes=serializer.validated_data
        )
        
        return Response(
            {
                'message': 'Profile updated successfully',
                'user': UserDetailSerializer(user).data
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        """Change user password"""
        user = request.user
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        old_password = serializer.validated_data.get('old_password')
        new_password = serializer.validated_data.get('new_password')
        
        if not user.check_password(old_password):
            return Response(
                {'error': 'Old password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        # Log audit
        AuditLog.objects.create(
            user=user,
            action='update',
            model_name='User',
            object_id=user.id,
            ip_address=self.get_client_ip(request),
            changes={'field': 'password'}
        )
        
        return Response(
            {'message': 'Password changed successfully'},
            status=status.HTTP_200_OK
        )
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for audit logs"""
    
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['user', 'action', 'model_name']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        user = self.request.user
        # Only allow users to see their own logs or admins see all
        if user.role in ['admin', 'hr']:
            return AuditLog.objects.all()
        return AuditLog.objects.filter(user=user)

class CurrentUserView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        try:
            employee = EmployeeProfile.objects.get(user=user)
            employee_data = EmployeeProfileSerializer(employee).data
        except EmployeeProfile.DoesNotExist:
            employee_data = None

        return Response({
            'user': UserSerializer(user).data,
            'employee': employee_data
        })

    def patch(self, request):
        user = request.user
        
        # Update User model fields
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        if 'first_name' in request.data or 'last_name' in request.data:
            user.full_name = f"{user.first_name} {user.last_name}".strip()
            
        if 'phone' in request.data:
            user.phone = request.data['phone']
        elif 'phone_number' in request.data:
            user.phone = request.data['phone_number']
            
        if 'profile_image' in request.FILES:
            user.profile_image = request.FILES['profile_image']
        if 'address' in request.data:
            user.address = request.data['address']
        if 'joining_date' in request.data:
            user.joining_date = request.data['joining_date'] or None
            
        user.save()
        
        # Update EmployeeProfile model fields
        try:
            employee, created = EmployeeProfile.objects.get_or_create(user=user)
            if 'phone_number' in request.data:
                employee.contact_number = request.data['phone_number']
            elif 'phone' in request.data:
                employee.contact_number = request.data['phone']
            
            if 'gender' in request.data:
                gender_val = request.data['gender']
                if gender_val in ['Male', 'M', 'm', 'MALE']:
                    employee.gender = 'M'
                elif gender_val in ['Female', 'F', 'f', 'FEMALE']:
                    employee.gender = 'F'
                elif gender_val in ['Other', 'O', 'o', 'OTHER']:
                    employee.gender = 'O'
                elif not gender_val:
                    employee.gender = None
                else:
                    employee.gender = gender_val
                    
            if 'date_of_birth' in request.data:
                employee.date_of_birth = request.data['date_of_birth'] or None
            if 'personal_email' in request.data:
                employee.personal_email = request.data['personal_email']
            if 'emergency_contact' in request.data:
                employee.emergency_contact = request.data['emergency_contact']
            if 'emergency_phone' in request.data:
                employee.emergency_phone = request.data['emergency_phone']
            if 'office_location' in request.data:
                employee.office_location = request.data['office_location']
                
            employee.save()
            employee_data = EmployeeProfileSerializer(employee).data
        except EmployeeProfile.DoesNotExist:
            employee_data = None

        return Response({
            'user': UserSerializer(user).data,
            'employee': employee_data
        })

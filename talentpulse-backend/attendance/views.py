# ATTENDANCE VIEWS
from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from attendance.models import LeaveType, LeaveBalance, LeaveApplication, AttendanceRecord, CheckInOut
from attendance.serializers import (
    LeaveTypeSerializer, LeaveBalanceSerializer, LeaveApplicationSerializer,
    AttendanceRecordSerializer, CheckInOutSerializer
)
from core.pagination import StandardResultsSetPagination
from notifications.tasks import dispatch_email
from django.db.models import Q


class LeaveTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class LeaveBalanceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LeaveBalanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['financial_year', 'leave_type']
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return LeaveBalance.objects.all()
        if user.role == 'manager':
            return LeaveBalance.objects.filter(Q(employee=user) | Q(employee__employee_profile__reporting_manager=user) | Q(employee__employee_profile__reporting_manager__isnull=True))
        return LeaveBalance.objects.filter(employee=user)


class LeaveApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['status', 'leave_type']
    ordering_fields = ['created_at', 'start_date']
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return LeaveApplication.objects.all()
        if user.role == 'manager':
            return LeaveApplication.objects.filter(
                Q(employee=user) | 
                Q(employee__employee_profile__reporting_manager=user) |
                (Q(employee__employee_profile__reporting_manager__isnull=True, status='pending') & ~Q(employee=user))
            )
        return LeaveApplication.objects.filter(employee=user)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        user = request.user
        
        # Write operations restrictions
        if self.action in ['update', 'partial_update']:
            new_status = request.data.get('status')
            if new_status and new_status in ['approved', 'rejected']:
                if user.role not in ['admin', 'hr']:
                    if user.role == 'manager':
                        if obj.employee == user:
                            raise PermissionDenied("You cannot approve or reject your own leave application.")
                        profile = getattr(obj.employee, 'employee_profile', None)
                        if profile and profile.reporting_manager and profile.reporting_manager != user:
                            raise PermissionDenied("You can only approve leaves for your team members.")
                    else:
                        raise PermissionDenied("You do not have permission to approve/reject leave applications.")
            
            # If changing other details, ensure they are the owner and it is not already approved/rejected
            elif obj.employee != user and user.role not in ['admin', 'hr']:
                raise PermissionDenied("You do not have permission to modify another user's leave application.")
        
        if self.action == 'destroy':
            if obj.employee != user and user.role not in ['admin', 'hr']:
                raise PermissionDenied("You cannot delete this leave application.")

    def perform_create(self, serializer):
        from core.utils import get_financial_year
        
        employee = serializer.validated_data.get('employee', self.request.user)
        leave_type = serializer.validated_data.get('leave_type')
        start_date = serializer.validated_data.get('start_date')
        end_date = serializer.validated_data.get('end_date')
        status_val = serializer.validated_data.get('status', 'pending')
        
        num_days = (end_date - start_date).days + 1
        fin_year = get_financial_year()
        
        balance, created = LeaveBalance.objects.get_or_create(
            employee=employee,
            leave_type=leave_type,
            financial_year=fin_year,
            defaults={'total_days': leave_type.max_days_per_year}
        )
        
        if num_days > balance.available_days:
            raise ValidationError(f"Insufficient leave balance. Requested: {num_days}, Available: {balance.available_days}")
            
        instance = serializer.save(employee=employee, status=status_val)
        
        if status_val == 'pending':
            balance.pending_days += num_days
            balance.save()
        elif status_val == 'approved':
            balance.used_days += num_days
            balance.save()
            self._create_attendance_for_leave(employee, start_date, end_date)
            
    def perform_update(self, serializer):
        from core.utils import get_financial_year
        
        old_instance = self.get_object()
        old_status = old_instance.status
        old_days = old_instance.number_of_days
        
        instance = serializer.save()
        new_status = instance.status
        new_days = instance.number_of_days
        
        if old_status == new_status and old_days == new_days:
            return
            
        fin_year = get_financial_year()
        balance, _ = LeaveBalance.objects.get_or_create(
            employee=instance.employee,
            leave_type=instance.leave_type,
            financial_year=fin_year,
            defaults={'total_days': instance.leave_type.max_days_per_year}
        )
        
        if old_status == 'pending':
            balance.pending_days = max(0, balance.pending_days - old_days)
        elif old_status == 'approved':
            balance.used_days = max(0, balance.used_days - old_days)
            self._remove_attendance_for_leave(instance.employee, old_instance.start_date, old_instance.end_date)
            
        if new_status == 'pending':
            balance.pending_days += new_days
        elif new_status == 'approved':
            balance.used_days += new_days
            self._create_attendance_for_leave(instance.employee, instance.start_date, instance.end_date)
            
        balance.save()

        # Trigger Leave Email Notification
        if old_status != new_status:
            try:
                profile = getattr(instance.employee, 'employee_profile', None)
                manager_name = "System HR"
                if profile and profile.reporting_manager:
                    manager_name = profile.reporting_manager.full_name or profile.reporting_manager.username
                elif self.request.user:
                    manager_name = self.request.user.full_name or self.request.user.username
                
                if new_status == 'approved':
                    dispatch_email('send_leave_approved', 
                                   instance.employee.email, 
                                   instance.employee.full_name or instance.employee.username, 
                                   instance.leave_type.name, 
                                   str(instance.start_date), 
                                   str(instance.end_date), 
                                   manager_name)
                elif new_status == 'rejected':
                    dispatch_email('send_leave_rejected', 
                                   instance.employee.email, 
                                   instance.employee.full_name or instance.employee.username, 
                                   instance.leave_type.name, 
                                   str(instance.start_date), 
                                   str(instance.end_date), 
                                   manager_name, 
                                   instance.remarks or '')
            except Exception as e:
                print("ERROR IN SENDING LEAVE EMAIL:", str(e))

    def _create_attendance_for_leave(self, employee, start_date, end_date):
        import datetime
        curr = start_date
        delta = datetime.timedelta(days=1)
        while curr <= end_date:
            AttendanceRecord.objects.update_or_create(
                employee=employee,
                date=curr,
                defaults={'status': 'leave', 'remarks': 'On Approved Leave'}
            )
            curr += delta
            
    def _remove_attendance_for_leave(self, employee, start_date, end_date):
        import datetime
        curr = start_date
        delta = datetime.timedelta(days=1)
        while curr <= end_date:
            AttendanceRecord.objects.filter(employee=employee, date=curr, status='leave').delete()
            curr += delta


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['status', 'date']
    ordering_fields = ['-date']
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return AttendanceRecord.objects.all()
        if user.role == 'manager':
            return AttendanceRecord.objects.filter(Q(employee=user) | Q(employee__employee_profile__reporting_manager=user) | Q(employee__employee_profile__reporting_manager__isnull=True))
        return AttendanceRecord.objects.filter(employee=user)

    def check_permissions(self, request):
        super().check_permissions(request)
        # Any writing to other's records is strictly for Admin/HR
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            if request.user.role not in ['admin', 'hr']:
                raise PermissionDenied("Only Admin and HR can manually log or edit attendance records.")


class CheckInOutViewSet(viewsets.ModelViewSet):
    serializer_class = CheckInOutSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    ordering_fields = ['-timestamp']
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return CheckInOut.objects.all()
        if user.role == 'manager':
            return CheckInOut.objects.filter(Q(employee=user) | Q(employee__employee_profile__reporting_manager=user) | Q(employee__employee_profile__reporting_manager__isnull=True))
        return CheckInOut.objects.filter(employee=user)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        user = request.user
        # Write operations are only allowed for self, or Admin/HR
        if self.action in ['update', 'partial_update', 'destroy']:
            if obj.employee != user and user.role not in ['admin', 'hr']:
                raise PermissionDenied("You cannot modify other check-in/out records.")
    
    @action(detail=False, methods=['post'])
    def check_in(self, request):
        """Check-in endpoint"""
        from django.utils import timezone
        
        now = timezone.now()
        today = now.date()
        current_time = now.time()
        
        check_in = CheckInOut.objects.create(
            employee=request.user,
            check_type='check_in',
            location=request.data.get('location'),
            latitude=request.data.get('latitude'),
            longitude=request.data.get('longitude')
        )
        
        attendance, created = AttendanceRecord.objects.get_or_create(
            employee=request.user,
            date=today,
            defaults={'status': 'present', 'check_in_time': current_time}
        )
        if not created:
            if not attendance.check_in_time:
                attendance.check_in_time = current_time
            if attendance.status == 'absent':
                attendance.status = 'present'
            attendance.save()
            
        serializer = self.get_serializer(check_in)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def check_out(self, request):
        """Check-out endpoint"""
        from django.utils import timezone
        from decimal import Decimal
        import datetime
        
        now = timezone.now()
        today = now.date()
        current_time = now.time()
        
        check_out = CheckInOut.objects.create(
            employee=request.user,
            check_type='check_out',
            location=request.data.get('location'),
            latitude=request.data.get('latitude'),
            longitude=request.data.get('longitude')
        )
        
        attendance, created = AttendanceRecord.objects.get_or_create(
            employee=request.user,
            date=today,
            defaults={'status': 'present', 'check_out_time': current_time}
        )
        if not created:
            attendance.check_out_time = current_time
            if attendance.status == 'absent':
                attendance.status = 'present'
            attendance.save()
            
        if attendance.check_in_time and attendance.check_out_time:
            d = datetime.date.today()
            t_in = datetime.datetime.combine(d, attendance.check_in_time)
            t_out = datetime.datetime.combine(d, attendance.check_out_time)
            if t_out > t_in:
                diff = t_out - t_in
                hours = Decimal(diff.total_seconds() / 3600.0)
                attendance.working_hours = round(hours, 2)
                attendance.save()
                
        serializer = self.get_serializer(check_out)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# EMPLOYEES VIEWS

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from employees.models import (
    Department, Designation, GradeStructure, EmployeeProfile,
    EmployeeEducation, EmployeeExperience, EmployeeSkill, Grievance
)
from employees.serializers import (
    DepartmentSerializer, DesignationSerializer, GradeStructureSerializer,
    EmployeeProfileSerializer, EmployeeProfilePublicSerializer, EmployeeEducationSerializer,
    EmployeeExperienceSerializer, EmployeeSkillSerializer, GrievanceSerializer
)
from core.pagination import StandardResultsSetPagination


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']

    def create(self, request, *args, **kwargs):
        designations_input = request.data.get('designations', '')
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        department = serializer.save()
        
        if designations_input:
            from employees.models import Designation
            if isinstance(designations_input, str):
                names = [n.strip() for n in designations_input.replace('\n', ',').split(',') if n.strip()]
            elif isinstance(designations_input, list):
                names = [str(n).strip() for n in designations_input if str(n).strip()]
            else:
                names = []
                
            for name in names:
                existing_desig = Designation.objects.filter(name=name).first()
                if existing_desig:
                    existing_desig.department = department
                    existing_desig.save()
                else:
                    Designation.objects.create(
                        name=name,
                        department=department,
                        description=f'Designation for {department.name}'
                    )
                
        headers = self.get_success_headers(serializer.data)
        return Response(self.get_serializer(department).data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        designations_input = request.data.get('designations', None)
        
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        department = serializer.save()
        
        if designations_input is not None:
            from employees.models import Designation
            if isinstance(designations_input, str):
                new_names = [n.strip() for n in designations_input.replace('\n', ',').split(',') if n.strip()]
            elif isinstance(designations_input, list):
                new_names = [str(n).strip() for n in designations_input if str(n).strip()]
            else:
                new_names = []
                
            current_desigs = Designation.objects.filter(department=department)
            current_names = [d.name for d in current_desigs]
            
            for name in new_names:
                if name not in current_names:
                    existing_desig = Designation.objects.filter(name=name).first()
                    if existing_desig:
                        existing_desig.department = department
                        existing_desig.save()
                    else:
                        Designation.objects.create(
                            name=name,
                            department=department,
                            description=f'Designation for {department.name}'
                        )
            
            for desig in current_desigs:
                if desig.name not in new_names:
                    if not desig.employees.exists():
                        desig.delete()
                        
        return Response(self.get_serializer(department).data)


class DesignationViewSet(viewsets.ModelViewSet):
    queryset = Designation.objects.all()
    serializer_class = DesignationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['department']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']


class GradeStructureViewSet(viewsets.ModelViewSet):
    queryset = GradeStructure.objects.all()
    serializer_class = GradeStructureSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    search_fields = ['grade']
    ordering_fields = ['level', 'base_salary']


class EmployeeProfileViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['department', 'designation', 'gender']
    search_fields = ['user__email', 'user__full_name', 'pan_number']
    ordering_fields = ['user__full_name', 'created_at']

    def get_queryset(self):
        user = self.request.user
        role = user.role.lower() if user.role else 'employee'

        # Admin: see every profile without restriction
        if role == 'admin':
            return EmployeeProfile.objects.all().select_related(
                'user', 'department', 'designation', 'reporting_manager'
            )

        # HR: see only profiles of users with role=employee
        # (HR should NOT see other managers/HR/admins in the directory)
        if role == 'hr':
            return EmployeeProfile.objects.filter(
                user__role='employee'
            ).select_related('user', 'department', 'designation', 'reporting_manager')

        # Manager: see direct reports, department members, or standard employees
        if role == 'manager':
            from django.db.models import Q
            q_filter = Q(reporting_manager=user) | Q(user__role='employee')
            try:
                if hasattr(user, 'employee_profile') and user.employee_profile.department:
                    q_filter |= Q(department=user.employee_profile.department)
            except Exception:
                pass
            return EmployeeProfile.objects.filter(q_filter).select_related('user', 'department', 'designation', 'reporting_manager')

        # Recruiter: read-only access to employee directory for context
        if role == 'recruiter':
            return EmployeeProfile.objects.filter(
                user__role='employee'
            ).select_related('user', 'department', 'designation', 'reporting_manager')

        # Employee / payroll / default: own profile, or other employees (public profiles)
        from django.db.models import Q
        return EmployeeProfile.objects.filter(
            Q(user=user) | Q(user__role='employee')
        ).select_related('user', 'department', 'designation', 'reporting_manager')

    def get_serializer_class(self):
        user = self.request.user
        if self.action in ['list', 'retrieve']:
            if user.role in ['admin', 'hr', 'recruiter', 'manager']:
                return EmployeeProfileSerializer
            # Own profile retrieve → full details
            if self.action == 'retrieve':
                try:
                    obj = self.get_object()
                    if obj.user == user:
                        return EmployeeProfileSerializer
                except Exception:
                    pass
            return EmployeeProfilePublicSerializer
        return EmployeeProfileSerializer

    def get_permissions(self):
        from core.permissions import IsHR, IsAdmin
        if self.action in ['create', 'destroy']:
            return [permissions.IsAuthenticated(), (IsHR | IsAdmin)()]
        return [permissions.IsAuthenticated()]

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if self.action in ['update', 'partial_update']:
            user = request.user
            if user.role not in ['admin', 'hr', 'manager'] and obj.user != user:
                self.permission_denied(
                    request,
                    message="You do not have permission to modify this profile."
                )


class EmployeeEducationViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeEducationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return EmployeeEducation.objects.filter(employee__user=self.request.user)


class EmployeeExperienceViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeExperienceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return EmployeeExperience.objects.filter(employee__user=self.request.user)


class EmployeeSkillViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSkillSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return EmployeeSkill.objects.filter(employee__user=self.request.user)


class GrievanceViewSet(viewsets.ModelViewSet):
    serializer_class = GrievanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['status', 'category', 'employee']
    search_fields = ['title', 'description', 'employee__full_name']
    ordering_fields = ['created_at', 'status']

    def get_queryset(self):
        user = self.request.user
        role = user.role.lower() if user.role else 'employee'
        
        # Admin or HRBP (hr) see ALL grievances
        if role in ['admin', 'hr', 'hrbp']:
            return Grievance.objects.all()
            
        # Managers see grievances raised by their subordinates or assigned to them
        if role == 'manager':
            from django.db.models import Q
            subordinate_ids = user.subordinates.values_list('user_id', flat=True)
            return Grievance.objects.filter(
                Q(employee=user) | 
                Q(employee_id__in=subordinate_ids) | 
                Q(assigned_to=user)
            )
            
        # Regular employees see only their own raised grievances
        return Grievance.objects.filter(employee=user)

    def perform_create(self, serializer):
        # Automatically set employee to the current authenticated user
        serializer.save(employee=self.request.user)

    def perform_update(self, serializer):
        # Set resolved_at if status becomes 'resolved' or 'closed'
        instance = serializer.save()
        if instance.status in ['resolved', 'closed'] and not instance.resolved_at:
            from django.utils import timezone
            instance.resolved_at = timezone.now()
            instance.save()

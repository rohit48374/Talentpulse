from rest_framework import permissions


class IsAuthenticated(permissions.IsAuthenticated):
    """Custom authenticated permission"""
    pass


class IsEmployee(permissions.BasePermission):
    """Allows access to employees"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'employee'


class IsManager(permissions.BasePermission):
    """Allows access to managers"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'manager'


class IsHR(permissions.BasePermission):
    """Allows access to HR (Human Resources)"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'hr'


class IsPayrollExecutive(permissions.BasePermission):
    """Allows access to Payroll Executives"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'payroll'


class IsRecruiter(permissions.BasePermission):
    """Allows access to Recruiters"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'recruiter'


class IsAdmin(permissions.BasePermission):
    """Allows access to Admins"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsAdminOrReadOnly(permissions.BasePermission):
    """Allows admins to edit, others can only read"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Allow users to edit their own profile"""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.id == request.user.id


class CanApproveLeave(permissions.BasePermission):
    """Allow managers, HR, and Admin to approve leaves"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['manager', 'hr', 'admin']


class CanApproveLeaveApplication(permissions.BasePermission):
    """Check if user can approve a specific leave application"""
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'admin':
            return True
        if request.user.role == 'hr':
            return True
        if request.user.role == 'manager':
            if obj.employee == request.user:
                return False  # Cannot approve own leave
            profile = getattr(obj.employee, 'employee_profile', None)
            if profile:
                if not profile.reporting_manager or profile.reporting_manager == request.user:
                    return True
        return False


# Legacy backward compatibility aliases
IsHRBP = IsHR
IsHRAdmin = IsAdmin
IsSuperAdmin = IsAdmin

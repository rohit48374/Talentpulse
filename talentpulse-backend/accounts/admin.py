from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from accounts.models import User, AuditLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User Admin"""
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Employee Information', {
            'fields': ('employee_id', 'full_name', 'phone', 'role', 
                      'department', 'designation', 'profile_image')
        }),
        ('Personal Details', {
            'fields': ('address', 'salary', 'joining_date', 'status')
        }),
    )
    
    list_display = ['full_name', 'email', 'employee_id', 'role', 'department', 'status']
    list_filter = ['role', 'status', 'department', 'created_at']
    search_fields = ['email', 'full_name', 'employee_id']
    ordering = ['-created_at']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Audit Log Admin"""
    
    list_display = ['user', 'action', 'model_name', 'object_id', 'timestamp']
    list_filter = ['action', 'model_name', 'timestamp']
    search_fields = ['user__email', 'model_name']
    readonly_fields = ['user', 'action', 'model_name', 'object_id', 'changes', 
                       'ip_address', 'user_agent', 'timestamp']
    ordering = ['-timestamp']
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser

from django.contrib import admin
from attendance.models import LeaveType, LeaveBalance, LeaveApplication, AttendanceRecord, CheckInOut


@admin.register(LeaveType)
class LeaveTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'max_days_per_year', 'is_paid', 'requires_approval']
    list_filter = ['is_paid', 'requires_approval']
    search_fields = ['name']


@admin.register(LeaveBalance)
class LeaveBalanceAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_type', 'financial_year', 'total_days', 'used_days', 'available_days']
    list_filter = ['financial_year', 'leave_type']
    search_fields = ['employee__email', 'employee__full_name']
    readonly_fields = ['available_days']


@admin.register(LeaveApplication)
class LeaveApplicationAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_type', 'start_date', 'end_date', 'status', 'number_of_days']
    list_filter = ['status', 'start_date', 'leave_type']
    search_fields = ['employee__email', 'employee__full_name']
    readonly_fields = ['created_at', 'updated_at', 'number_of_days']


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'status', 'check_in_time', 'check_out_time', 'working_hours']
    list_filter = ['status', 'date']
    search_fields = ['employee__email', 'employee__full_name']
    date_hierarchy = 'date'


@admin.register(CheckInOut)
class CheckInOutAdmin(admin.ModelAdmin):
    list_display = ['employee', 'check_type', 'timestamp', 'location']
    list_filter = ['check_type', 'timestamp']
    search_fields = ['employee__email', 'employee__full_name']
    readonly_fields = ['timestamp']

from django.contrib import admin
from analytics.models import AnalyticsSnapshot, DepartmentAnalytics


@admin.register(AnalyticsSnapshot)
class AnalyticsSnapshotAdmin(admin.ModelAdmin):
    list_display = ['snapshot_date', 'total_employees', 'active_employees', 'attrition_rate']
    list_filter = ['snapshot_date']
    date_hierarchy = 'snapshot_date'
    readonly_fields = ['created_at', 'updated_at']


@admin.register(DepartmentAnalytics)
class DepartmentAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['department_name', 'snapshot_date', 'employee_count', 'average_salary']
    list_filter = ['department_name', 'snapshot_date']
    search_fields = ['department_name']

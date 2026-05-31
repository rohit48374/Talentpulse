# ANALYTICS SERIALIZERS
from rest_framework import serializers
from analytics.models import AnalyticsSnapshot, DepartmentAnalytics, HRReport


class AnalyticsSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsSnapshot
        fields = ['id', 'snapshot_date', 'total_employees', 'active_employees',
                  'on_leave_employees', 'exited_employees_ytd', 'attrition_rate',
                  'open_positions', 'applications_pending', 'offers_pending',
                  'total_payroll_amount', 'processed_payrolls', 'pending_payrolls',
                  'average_attendance_rate', 'absent_today', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class DepartmentAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepartmentAnalytics
        fields = ['id', 'department_name', 'snapshot_date', 'employee_count',
                  'average_salary', 'attrition_rate', 'created_at']
        read_only_fields = ['created_at']


class HRReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = HRReport
        fields = ['id', 'scope', 'metrics', 'generated_date']
        read_only_fields = ['generated_date']

# ATTENDANCE SERIALIZERS
from rest_framework import serializers
from attendance.models import LeaveType, LeaveBalance, LeaveApplication, AttendanceRecord, CheckInOut


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = ['id', 'name', 'description', 'max_days_per_year', 'annual_quota', 'carry_forward_allowed', 'is_paid',
                  'requires_approval', 'gender_specific', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class LeaveBalanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    available_days = serializers.SerializerMethodField()
    
    class Meta:
        model = LeaveBalance
        fields = ['id', 'employee', 'employee_name', 'employee_id', 'leave_type', 'leave_type_name',
                  'financial_year', 'total_days', 'used_days', 'pending_days', 'available_days',
                  'year', 'entitled', 'taken', 'pending', 'balance']
    
    def get_available_days(self, obj):
        return obj.available_days


class LeaveApplicationSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)
    number_of_days = serializers.SerializerMethodField()
    
    class Meta:
        model = LeaveApplication
        fields = ['id', 'employee', 'employee_name', 'employee_id', 'leave_type', 'leave_type_name',
                  'start_date', 'end_date', 'days_requested', 'number_of_days', 'reason', 'status',
                  'approved_by', 'approved_by_name', 'approval_date', 'approval_remarks',
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'approval_date']
    
    def get_number_of_days(self, obj):
        return obj.number_of_days


class AttendanceRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    
    class Meta:
        model = AttendanceRecord
        fields = ['id', 'employee', 'employee_name', 'employee_id', 'date', 'status', 'check_in_time',
                  'check_out_time', 'working_hours', 'remarks', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class CheckInOutSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    
    class Meta:
        model = CheckInOut
        fields = ['id', 'employee', 'employee_name', 'employee_id', 'check_type', 'timestamp',
                  'location', 'latitude', 'longitude', 'device_info']
        read_only_fields = ['timestamp']


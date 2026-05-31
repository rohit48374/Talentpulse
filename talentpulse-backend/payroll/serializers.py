# PAYROLL SERIALIZERS
from rest_framework import serializers
from payroll.models import SalaryStructure, PayrollRun, Payslip, Bonus


class SalaryStructureSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    grade_name = serializers.CharField(source='grade.grade', read_only=True)
    gross_salary = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_deductions = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    net_salary = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = SalaryStructure
        fields = ['id', 'employee', 'employee_name', 'employee_id', 'grade', 'grade_name', 'base_salary', 'basic_percent', 'hra_percent', 'hra', 'da',
                  'other_allowances', 'allowances', 'pf_contribution', 'it', 'other_deductions', 'deduction_rules',
                  'gross_salary', 'total_deductions', 'net_salary', 'effective_from',
                  'effective_to', 'effective_date', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PayrollRunSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.full_name', read_only=True)
    
    class Meta:
        model = PayrollRun
        fields = ['id', 'month_year', 'status', 'total_employees', 'total_gross_salary',
                  'total_deductions', 'total_net_salary', 'created_by', 'created_by_name',
                  'approved_by', 'approved_by_name', 'approval_date', 'month', 'year',
                  'processed_by', 'processed_by_name', 'processed_date', 'total_gross', 'total_net', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PayslipSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    payroll_month = serializers.CharField(source='payroll_run.month_year', read_only=True)
    
    class Meta:
        model = Payslip
        fields = ['id', 'payroll_run', 'payroll_month', 'employee', 'employee_name', 'employee_id',
                  'base_salary', 'hra', 'da', 'other_allowances', 'bonus', 'gross_salary',
                  'pf_contribution', 'it', 'other_deductions', 'total_deductions', 'net_salary',
                  'days_worked', 'days_leave', 'status', 'gross_amount', 'total_deductions_field', 'net_amount', 'payslip_date',
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class BonusSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)
    
    class Meta:
        model = Bonus
        fields = ['id', 'employee', 'employee_name', 'employee_id', 'bonus_type', 'amount', 'month_year',
                  'status', 'approved_by', 'approved_by_name', 'remarks', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


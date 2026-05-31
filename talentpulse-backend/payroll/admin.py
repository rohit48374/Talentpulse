from django.contrib import admin
from payroll.models import SalaryStructure, PayrollRun, Payslip, Bonus


@admin.register(SalaryStructure)
class SalaryStructureAdmin(admin.ModelAdmin):
    list_display = ['employee', 'base_salary', 'gross_salary', 'net_salary', 'effective_from']
    list_filter = ['effective_from']
    search_fields = ['employee__email', 'employee__full_name']
    readonly_fields = ['gross_salary', 'total_deductions', 'net_salary']


@admin.register(PayrollRun)
class PayrollRunAdmin(admin.ModelAdmin):
    list_display = ['month_year', 'status', 'total_employees', 'total_gross_salary', 'total_net_salary']
    list_filter = ['status', 'month_year']
    search_fields = ['month_year']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Payslip)
class PayslipAdmin(admin.ModelAdmin):
    list_display = ['employee', 'payroll_run', 'gross_salary', 'net_salary', 'status']
    list_filter = ['status', 'payroll_run']
    search_fields = ['employee__email', 'employee__full_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Bonus)
class BonusAdmin(admin.ModelAdmin):
    list_display = ['employee', 'bonus_type', 'amount', 'month_year', 'status']
    list_filter = ['status', 'month_year']
    search_fields = ['employee__email', 'employee__full_name']
    readonly_fields = ['created_at', 'updated_at']

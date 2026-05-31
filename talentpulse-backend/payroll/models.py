# PAYROLL MODULE - models.py

from django.db import models
from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()


import datetime
from datetime import date

class SalaryStructure(models.Model):
    """Employee salary structure"""
    
    employee = models.OneToOneField(User, on_delete=models.CASCADE, related_name='salary_structure')
    grade = models.ForeignKey('employees.GradeStructure', on_delete=models.SET_NULL, null=True, blank=True, related_name='salary_structures')
    base_salary = models.DecimalField(max_digits=12, decimal_places=2)
    basic_percent = models.DecimalField(max_digits=5, decimal_places=2, default=50.00)
    hra_percent = models.DecimalField(max_digits=5, decimal_places=2, default=20.00)
    hra = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # House Rent Allowance
    da = models.DecimalField(max_digits=12, decimal_places=2, default=0)   # Dearness Allowance
    other_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    allowances = models.JSONField(default=dict, blank=True)
    pf_contribution = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # Provident Fund
    it = models.DecimalField(max_digits=12, decimal_places=2, default=0)   # Income Tax
    other_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deduction_rules = models.JSONField(default=dict, blank=True)
    effective_from = models.DateField()
    effective_to = models.DateField(blank=True, null=True)
    effective_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'salary_structures'
    
    @property
    def gross_salary(self):
        return self.base_salary + self.hra + self.da + self.other_allowances
    
    @property
    def total_deductions(self):
        return self.pf_contribution + self.it + self.other_deductions
    
    @property
    def net_salary(self):
        return self.gross_salary - self.total_deductions
    
    def __str__(self):
        return f"{self.employee.full_name} - Salary Structure"


class PayrollRun(models.Model):
    """Monthly/periodic payroll processing"""
    
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('processed', 'Processed'),
        ('approved', 'Approved'),
        ('disbursed', 'Disbursed'),
        ('cancelled', 'Cancelled'),
    )
    
    month_year = models.CharField(max_length=7)  # e.g., "2024-05"
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    total_employees = models.IntegerField()
    total_gross_salary = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_net_salary = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='payroll_runs_created')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='payroll_runs_approved')
    approval_date = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # compliance fields
    month = models.IntegerField(blank=True, null=True)
    year = models.IntegerField(blank=True, null=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_payrolls')
    processed_date = models.DateField(blank=True, null=True)
    total_gross = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_net = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    class Meta:
        db_table = 'payroll_runs'
        unique_together = ['month_year']
        ordering = ['-month_year']
        
    def save(self, *args, **kwargs):
        if self.month_year and (not self.month or not self.year):
            try:
                parts = self.month_year.split('-')
                self.year = int(parts[0])
                self.month = int(parts[1])
            except (ValueError, IndexError):
                pass
        if not self.processed_by:
            self.processed_by = self.created_by
        if not self.processed_date:
            self.processed_date = date.today()
        self.total_gross = self.total_gross_salary
        self.total_net = self.total_net_salary
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Payroll - {self.month_year}"


class Payslip(models.Model):
    """Employee payslip"""
    
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('generated', 'Generated'),
        ('approved', 'Approved'),
        ('disbursed', 'Disbursed'),
        ('issued', 'Issued'),
    )
    
    payroll_run = models.ForeignKey(PayrollRun, on_delete=models.CASCADE, related_name='payslips')
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payslips')
    base_salary = models.DecimalField(max_digits=12, decimal_places=2)
    hra = models.DecimalField(max_digits=12, decimal_places=2)
    da = models.DecimalField(max_digits=12, decimal_places=2)
    other_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    bonus = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2)
    pf_contribution = models.DecimalField(max_digits=12, decimal_places=2)
    it = models.DecimalField(max_digits=12, decimal_places=2)
    other_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)
    days_worked = models.IntegerField(default=0)
    days_leave = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # compliance fields
    gross_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deductions_field = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # TotalDeductions mapped
    net_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payslip_date = models.DateField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payslips'
        unique_together = ['payroll_run', 'employee']
        ordering = ['-created_at']
        
    def save(self, *args, **kwargs):
        self.gross_amount = self.gross_salary
        self.total_deductions_field = self.total_deductions
        self.net_amount = self.net_salary
        if not self.payslip_date:
            self.payslip_date = date.today()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Payslip - {self.employee.full_name}"


class Bonus(models.Model):
    """Bonus/Additional compensation"""
    
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('approved', 'Approved'),
        ('disbursed', 'Disbursed'),
    )
    
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bonuses')
    bonus_type = models.CharField(max_length=100)  # e.g., Annual Bonus, Performance Bonus
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    month_year = models.CharField(max_length=7)  # e.g., "2024-05"
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='bonuses_approved')
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'bonuses'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.bonus_type}"

# ANALYTICS MODULE - models.py

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class AnalyticsSnapshot(models.Model):
    """Daily analytics snapshot for dashboard"""
    
    snapshot_date = models.DateField(unique=True, db_index=True)
    
    # Headcount
    total_employees = models.IntegerField()
    active_employees = models.IntegerField()
    on_leave_employees = models.IntegerField()
    
    # Attrition
    exited_employees_ytd = models.IntegerField()
    attrition_rate = models.DecimalField(max_digits=5, decimal_places=2)
    
    # Recruitment
    open_positions = models.IntegerField()
    applications_pending = models.IntegerField()
    offers_pending = models.IntegerField()
    
    # Payroll
    total_payroll_amount = models.DecimalField(max_digits=15, decimal_places=2)
    processed_payrolls = models.IntegerField()
    pending_payrolls = models.IntegerField()
    
    # Attendance
    average_attendance_rate = models.DecimalField(max_digits=5, decimal_places=2)
    absent_today = models.IntegerField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_snapshots'
        ordering = ['-snapshot_date']
    
    def __str__(self):
        return f"Analytics - {self.snapshot_date}"


class DepartmentAnalytics(models.Model):
    """Department-wise analytics"""
    
    department_name = models.CharField(max_length=100)
    snapshot_date = models.DateField()
    
    employee_count = models.IntegerField()
    average_salary = models.DecimalField(max_digits=12, decimal_places=2)
    attrition_rate = models.DecimalField(max_digits=5, decimal_places=2)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'department_analytics'
        unique_together = ['department_name', 'snapshot_date']
        ordering = ['-snapshot_date']
    
    def __str__(self):
        return f"{self.department_name} - {self.snapshot_date}"


class HRReport(models.Model):
    """HR Analytics & Reporting model"""
    
    SCOPE_CHOICES = (
        ('department', 'Department'),
        ('grade', 'Grade'),
        ('period', 'Period'),
        ('cost_centre', 'Cost Centre'),
    )
    
    scope = models.CharField(max_length=50, choices=SCOPE_CHOICES)
    metrics = models.JSONField(default=dict, blank=True)  # Stores Headcount, AttritionRate, AvgTenure, PayrollCost, LeaveUtilisation, PerformanceDistribution
    generated_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'hr_reports'
        ordering = ['-generated_date']
        
    def __str__(self):
        return f"HR Report - {self.scope} ({self.generated_date.date()})"

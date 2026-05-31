# ATTENDANCE MODULE - models.py

from django.db import models
from django.contrib.auth import get_user_model
from datetime import date

User = get_user_model()


class LeaveType(models.Model):
    """Leave type configuration"""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    max_days_per_year = models.IntegerField(default=0)
    annual_quota = models.IntegerField(default=0)
    carry_forward_allowed = models.BooleanField(default=False)
    is_paid = models.BooleanField(default=True)
    requires_approval = models.BooleanField(default=True)
    gender_specific = models.CharField(
        max_length=1,
        choices=[('M', 'Male'), ('F', 'Female'), ('N', 'No')],
        default='N'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'leave_types'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class LeaveBalance(models.Model):
    """Employee leave balance per financial year"""
    
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leave_balances')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE, related_name='balances')
    financial_year = models.CharField(max_length=9)  # e.g., "2024-2025"
    total_days = models.IntegerField()
    used_days = models.IntegerField(default=0)
    pending_days = models.IntegerField(default=0)
    
    # compliance fields
    year = models.IntegerField(blank=True, null=True)
    entitled = models.IntegerField(blank=True, null=True)
    taken = models.IntegerField(default=0)
    pending = models.IntegerField(default=0)
    balance = models.IntegerField(blank=True, null=True)
    
    class Meta:
        db_table = 'leave_balances'
        unique_together = ['employee', 'leave_type', 'financial_year']
    
    @property
    def available_days(self):
        return self.total_days - self.used_days
    
    def save(self, *args, **kwargs):
        if self.financial_year and not self.year:
            try:
                self.year = int(self.financial_year.split('-')[0])
            except (ValueError, IndexError):
                pass
        self.entitled = self.total_days
        self.taken = self.used_days
        self.pending = self.pending_days
        self.balance = self.available_days
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.leave_type.name} ({self.financial_year})"


class LeaveApplication(models.Model):
    """Leave application/request"""
    
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    )
    
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leave_applications')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.PROTECT)
    start_date = models.DateField()
    end_date = models.DateField()
    days_requested = models.IntegerField(blank=True, null=True)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='approved_leave_applications')
    approval_date = models.DateTimeField(blank=True, null=True)
    approval_remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'leave_applications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['start_date', 'end_date']),
        ]
    
    @property
    def number_of_days(self):
        return (self.end_date - self.start_date).days + 1
    
    def save(self, *args, **kwargs):
        if self.start_date and self.end_date:
            self.days_requested = (self.end_date - self.start_date).days + 1
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.leave_type.name}"


class AttendanceRecord(models.Model):
    """Employee attendance record"""
    
    STATUS_CHOICES = (
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('half_day', 'Half Day'),
        ('on_leave', 'On Leave'),
        ('holiday', 'Holiday'),
        ('leave', 'Leave'),
        ('work_from_home', 'Work From Home'),
    )
    
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField(db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    check_in_time = models.TimeField(blank=True, null=True)
    check_out_time = models.TimeField(blank=True, null=True)
    working_hours = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'attendance_records'
        unique_together = ['employee', 'date']
        ordering = ['-date']
        indexes = [
            models.Index(fields=['employee', 'date']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.date} - {self.status}"


class CheckInOut(models.Model):
    """Real-time check-in/check-out tracking"""
    
    TYPE_CHOICES = (
        ('check_in', 'Check In'),
        ('check_out', 'Check Out'),
    )
    
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='check_in_outs')
    check_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    location = models.CharField(max_length=200, blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    device_info = models.CharField(max_length=200, blank=True, null=True)
    
    class Meta:
        db_table = 'check_in_outs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['employee', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.check_type}"

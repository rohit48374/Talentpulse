import os
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import FileExtensionValidator
from core.utils import upload_profile_image_path, generate_employee_id


class User(AbstractUser):
    """Custom User model for TalentPulse HRMS"""
    
    ROLE_CHOICES = (
        ('employee', 'Employee'),
        ('manager', 'Manager'),
        ('hr', 'HR (Human Resources)'),
        ('recruiter', 'Recruiter'),
        ('payroll', 'Payroll Executive'),
        ('admin', 'Admin'),
    )
    
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('on_leave', 'On Leave'),
        ('inactive', 'Inactive'),
        ('exited', 'Exited'),
    )
    
    # Employee specific fields
    employee_id = models.CharField(max_length=50, unique=True, default=generate_employee_id)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    department = models.CharField(max_length=100, blank=True, null=True)
    designation = models.CharField(max_length=100, blank=True, null=True)
    
    # Profile image
    profile_image = models.ImageField(
        upload_to=upload_profile_image_path,
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png', 'gif'])],
        blank=True,
        null=True
    )
    
    # Personal details
    address = models.TextField(blank=True, null=True)
    salary = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    joining_date = models.DateField(blank=True, null=True)
    
    # Status management
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Password reset fields
    reset_token = models.CharField(max_length=100, blank=True, null=True)
    reset_token_expires_at = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['employee_id']),
            models.Index(fields=['role']),
            models.Index(fields=['status']),
        ]
    
    def save(self, *args, **kwargs):
        # Auto-generate employee ID if not set or blank
        if not self.employee_id or self.employee_id == "":
            self.employee_id = generate_employee_id()
            
        # Enforce immutability: Employee ID cannot be edited after creation
        if self.pk:
            try:
                original = User.objects.get(pk=self.pk)
                self.employee_id = original.employee_id
            except User.DoesNotExist:
                pass
                
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} ({self.employee_id})"
    
    def is_hr_staff(self):
        """Check if user is HR staff"""
        return self.role in ['hr', 'admin']
    
    def is_manager(self):
        """Check if user is a manager"""
        return self.role in ['manager', 'hr', 'admin']
    
    def is_recruiter(self):
        """Check if user is a recruiter"""
        return self.role in ['recruiter', 'admin']


class AuditLog(models.Model):
    """Audit logging for all user actions"""
    
    ACTION_CHOICES = (
        ('create', 'Created'),
        ('update', 'Updated'),
        ('delete', 'Deleted'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('approve', 'Approved'),
        ('reject', 'Rejected'),
    )
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.BigIntegerField()
    changes = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
            models.Index(fields=['model_name']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.action} - {self.model_name}"

# NOTIFICATIONS MODULE - models.py

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Notification(models.Model):
    """System notifications"""
    
    NOTIFICATION_TYPE_CHOICES = (
        ('leave_status', 'Leave Status'),
        ('leave_reminder', 'Leave Reminder'),
        ('payroll', 'Payroll Alert'),
        ('recruitment', 'Recruitment Update'),
        ('appraisal', 'Appraisal Reminder'),
        ('attendance', 'Attendance Alert'),
        ('system', 'System Message'),
        ('leave', 'Leave'),
        ('payroll_alert', 'Payroll'),
        ('appraisal_alert', 'Appraisal'),
        ('recruitment_alert', 'Recruitment'),
        ('compliance', 'Compliance'),
    )
    
    STATUS_CHOICES = (
        ('unread', 'Unread'),
        ('read', 'Read'),
        ('dismissed', 'Dismissed'),
    )
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    related_object_type = models.CharField(max_length=100, blank=True, null=True)
    related_object_id = models.BigIntegerField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unread')
    action_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'status']),
            models.Index(fields=['notification_type']),
        ]
    
    def __str__(self):
        return f"Notification - {self.title}"


class NotificationPreference(models.Model):
    """User notification preferences"""
    
    FREQUENCY_CHOICES = (
        ('instant', 'Instant'),
        ('daily', 'Daily Digest'),
        ('weekly', 'Weekly Digest'),
        ('never', 'Never'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preference')
    leave_notifications = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='instant')
    payroll_notifications = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='instant')
    recruitment_notifications = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    appraisal_notifications = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='instant')
    attendance_notifications = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_preferences'
    
    def __str__(self):
        return f"Preferences - {self.user.full_name}"

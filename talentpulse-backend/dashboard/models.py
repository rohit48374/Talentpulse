# DASHBOARD MODULE - models.py

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class DashboardCard(models.Model):
    """Dashboard widget/card configurations"""
    
    CARD_TYPE_CHOICES = (
        ('metric', 'Metric Card'),
        ('chart', 'Chart Card'),
        ('list', 'List Card'),
        ('summary', 'Summary Card'),
    )
    
    ROLE_CHOICES = (
        ('employee', 'Employee'),
        ('manager', 'Manager'),
        ('hr', 'HR (Human Resources)'),
        ('recruiter', 'Recruiter'),
        ('payroll', 'Payroll Executive'),
        ('admin', 'Admin'),
    )
    
    title = models.CharField(max_length=200)
    card_type = models.CharField(max_length=20, choices=CARD_TYPE_CHOICES)
    applicable_role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)
    position = models.IntegerField(default=0)  # For ordering
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'dashboard_cards'
        ordering = ['applicable_role', 'position']
    
    def __str__(self):
        return self.title

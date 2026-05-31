# APPRAISAL MODULE - models.py

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class AppraisalCycle(models.Model):
    """Appraisal cycle configuration"""
    
    STATUS_CHOICES = (
        ('planning', 'Planning'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
        ('upcoming', 'Upcoming'),
        ('closed', 'Closed'),
    )
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    financial_year = models.CharField(max_length=9)  # e.g., "2024-2025"
    
    # compliance fields
    year = models.IntegerField(blank=True, null=True)
    cycle_type = models.CharField(max_length=20, choices=(('mid_year', 'Mid-Year'), ('annual', 'Annual')), default='annual')
    goal_setting_start = models.DateField(blank=True, null=True)
    goal_setting_end = models.DateField(blank=True, null=True)
    review_start = models.DateField(blank=True, null=True)
    review_end = models.DateField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='appraisal_cycles_created')
    
    def save(self, *args, **kwargs):
        if self.financial_year and not self.year:
            try:
                self.year = int(self.financial_year.split('-')[0])
            except (ValueError, IndexError):
                pass
        if self.start_date and not self.review_start:
            self.review_start = self.start_date
        if self.end_date and not self.review_end:
            self.review_end = self.end_date
        super().save(*args, **kwargs)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'appraisal_cycles'
        ordering = ['-start_date']
    
    def __str__(self):
        return self.name


class GoalSheet(models.Model):
    """Employee goals/objectives"""
    
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('reviewed', 'Reviewed'),
        ('finalised', 'Finalised'),
    )
    
    appraisal_cycle = models.ForeignKey(AppraisalCycle, on_delete=models.CASCADE, related_name='goal_sheets')
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goal_sheets')
    goal_title = models.CharField(max_length=200, blank=True, null=True)
    goal_description = models.TextField(blank=True, null=True)
    target_value = models.CharField(max_length=100, blank=True, null=True)
    weight = models.IntegerField(default=10, blank=True, null=True)  # Weight in %
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    manager_comments = models.TextField(blank=True, null=True)
    actual_value = models.CharField(max_length=100, blank=True, null=True)
    achievement_percentage = models.IntegerField(blank=True, null=True)
    
    # compliance fields
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='goal_sheets_managed')
    goals_json = models.JSONField(default=list, blank=True)
    self_rating = models.IntegerField(blank=True, null=True)
    manager_rating = models.IntegerField(blank=True, null=True)
    final_rating = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'goal_sheets'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.goal_title}"


class EmployeeAppraisal(models.Model):
    """Employee performance appraisal"""
    
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('self_review', 'Self Review'),
        ('manager_review', 'Manager Review'),
        ('final', 'Final'),
        ('completed', 'Completed'),
    )
    
    RATING_CHOICES = (
        (1, 'Poor'),
        (2, 'Below Average'),
        (3, 'Average'),
        (4, 'Good'),
        (5, 'Excellent'),
    )
    
    appraisal_cycle = models.ForeignKey(AppraisalCycle, on_delete=models.CASCADE, related_name='employee_appraisals')
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appraisals')
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='appraisals_given')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Self assessment
    self_rating = models.IntegerField(choices=RATING_CHOICES, blank=True, null=True)
    self_comments = models.TextField(blank=True, null=True)
    
    # Manager assessment
    manager_rating = models.IntegerField(choices=RATING_CHOICES, blank=True, null=True)
    manager_comments = models.TextField(blank=True, null=True)
    
    # Final rating
    final_rating = models.IntegerField(choices=RATING_CHOICES, blank=True, null=True)
    performance_remarks = models.TextField(blank=True, null=True)
    
    # Development plan
    strengths = models.TextField(blank=True, null=True)
    areas_for_improvement = models.TextField(blank=True, null=True)
    development_plan = models.TextField(blank=True, null=True)
    
    submitted_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'employee_appraisals'
        unique_together = ['appraisal_cycle', 'employee']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.employee.full_name} - Appraisal"


class PromotionRecommendation(models.Model):
    """Promotion recommendation"""
    
    STATUS_CHOICES = (
        ('recommended', 'Recommended'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('implemented', 'Implemented'),
        ('declined', 'Declined'),
    )
    
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='promotion_recommendations')
    appraisal_cycle = models.ForeignKey(AppraisalCycle, on_delete=models.CASCADE, related_name='promotion_recommendations')
    current_designation = models.CharField(max_length=100)
    recommended_designation = models.CharField(max_length=100)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='recommended')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='promotions_approved')
    
    # compliance fields
    current_grade = models.ForeignKey('employees.GradeStructure', on_delete=models.SET_NULL, null=True, blank=True, related_name='promotions_current')
    recommended_grade = models.ForeignKey('employees.GradeStructure', on_delete=models.SET_NULL, null=True, blank=True, related_name='promotions_recommended')
    recommended_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='promotions_recommended_by')
    
    def save(self, *args, **kwargs):
        if not self.recommended_by:
            self.recommended_by = self.approved_by
        super().save(*args, **kwargs)
    salary_increment_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    effective_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'promotion_recommendations'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Promotion - {self.employee.full_name}"

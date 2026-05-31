from django.db import models
from django.contrib.auth import get_user_model
from core.utils import upload_profile_image_path

User = get_user_model()


class Department(models.Model):
    """Department model"""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    head = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='department_head')
    budget = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    cost_centre_code = models.CharField(max_length=50, blank=True, null=True)
    hrbp_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='hrbp_departments')
    status = models.CharField(max_length=20, choices=(('active', 'Active'), ('inactive', 'Inactive')), default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'departments'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
        ]
    
    def __str__(self):
        return self.name


class Designation(models.Model):
    """Job designation/Title model"""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='designations')
    grade = models.CharField(max_length=20, blank=True, null=True)
    salary_range_min = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    salary_range_max = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'designations'
        ordering = ['name']
        indexes = [
            models.Index(fields=['department', 'name']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.department}"


class GradeStructure(models.Model):
    """Salary grade structure"""
    
    grade = models.CharField(max_length=20, unique=True)
    level = models.IntegerField()
    base_salary = models.DecimalField(max_digits=12, decimal_places=2)
    band = models.CharField(max_length=50, blank=True, null=True)
    min_salary = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    max_salary = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    leave_entitlement = models.IntegerField(default=20)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'grade_structures'
        ordering = ['level']
        indexes = [
            models.Index(fields=['grade']),
        ]
    
    def __str__(self):
        return f"Grade {self.grade} - Level {self.level}"


class EmployeeProfile(models.Model):
    """Extended employee profile information"""
    
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='employees')
    designation = models.ForeignKey(Designation, on_delete=models.SET_NULL, null=True, related_name='employees')
    grade = models.ForeignKey(GradeStructure, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    reporting_manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates')
    joining_date = models.DateField(blank=True, null=True)
    employment_type = models.CharField(max_length=20, choices=(('permanent', 'Permanent'), ('contract', 'Contract'), ('intern', 'Intern')), default='permanent')
    status = models.CharField(max_length=20, choices=(('active', 'Active'), ('probation', 'Probation'), ('resigned', 'Resigned'), ('exited', 'Exited')), default='active')
    
    # Personal details
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    personal_email = models.EmailField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=100, blank=True, null=True)
    emergency_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Location & work details
    office_location = models.CharField(max_length=100, blank=True, null=True)
    work_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Identification
    pan_number = models.CharField(max_length=20, blank=True, null=True, unique=True)
    aadhar_number = models.CharField(max_length=20, blank=True, null=True, unique=True)
    passport_number = models.CharField(max_length=30, blank=True, null=True, unique=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'employee_profiles'
        ordering = ['user__full_name']
        indexes = [
            models.Index(fields=['department']),
            models.Index(fields=['designation']),
            models.Index(fields=['reporting_manager']),
        ]
    
    def __str__(self):
        return f"{self.user.full_name} - {self.designation}"


class EmployeeEducation(models.Model):
    """Employee education history"""
    
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE, related_name='education_history')
    institution = models.CharField(max_length=200)
    qualification = models.CharField(max_length=100)
    field_of_study = models.CharField(max_length=100, blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    grade_or_score = models.CharField(max_length=20, blank=True, null=True)
    
    class Meta:
        db_table = 'employee_education'
        ordering = ['-end_date']
    
    def __str__(self):
        return f"{self.employee.user.full_name} - {self.qualification}"


class EmployeeExperience(models.Model):
    """Employee work experience"""
    
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE, related_name='experience_history')
    company_name = models.CharField(max_length=200)
    designation = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'employee_experience'
        ordering = ['-end_date']
    
    def __str__(self):
        return f"{self.employee.user.full_name} - {self.company_name}"


class EmployeeSkill(models.Model):
    """Employee skills"""
    
    PROFICIENCY_CHOICES = (
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    )
    
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE, related_name='skills')
    skill_name = models.CharField(max_length=100)
    proficiency = models.CharField(max_length=20, choices=PROFICIENCY_CHOICES)
    years_of_experience = models.IntegerField(blank=True, null=True)
    
    class Meta:
        db_table = 'employee_skills'
        ordering = ['skill_name']
        unique_together = ['employee', 'skill_name']
    
    def __str__(self):
        return f"{self.employee.user.full_name} - {self.skill_name}"


class Grievance(models.Model):
    """Grievance reporting and management model"""
    
    CATEGORY_CHOICES = (
        ('workplace', 'Workplace Environment'),
        ('payroll', 'Payroll & Compensation'),
        ('harassment', 'Harassment or Bullying'),
        ('management', 'Management & Leadership'),
        ('policy', 'Policy & Benefits'),
        ('other', 'Other Grievance'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending Review'),
        ('in_progress', 'Under Investigation'),
        ('resolved', 'Resolved'),
        ('escalated', 'Escalated'),
        ('closed', 'Closed'),
    )
    
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='raised_grievances')
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='other')
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_grievances')
    resolution_details = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'grievances'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['category']),
        ]
        
    def __str__(self):
        return f"{self.title} - {self.employee.full_name} ({self.status})"

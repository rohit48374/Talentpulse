# RECRUITMENT MODULE - models.py

from django.db import models
from django.contrib.auth import get_user_model
from core.utils import upload_resume_path, upload_offer_letter_path

User = get_user_model()


class JobRequisition(models.Model):
    """Job requisition/opening"""
    
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('approved', 'Approved'),
        ('open', 'Open'),
        ('filled', 'Filled'),
        ('cancelled', 'Cancelled'),
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    department = models.CharField(max_length=100, blank=True, null=True)
    designation = models.CharField(max_length=100, blank=True, null=True)
    department_ref = models.ForeignKey('employees.Department', on_delete=models.CASCADE, related_name='requisitions', blank=True, null=True)
    designation_ref = models.ForeignKey('employees.Designation', on_delete=models.CASCADE, related_name='requisitions', blank=True, null=True)
    grade = models.ForeignKey('employees.GradeStructure', on_delete=models.SET_NULL, null=True, blank=True, related_name='requisitions')
    position_count = models.IntegerField(default=1)
    salary_range_min = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    salary_range_max = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    required_by = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='requisitions_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'job_requisitions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.status}"


class CandidateAccount(models.Model):
    """External candidate account for login and dashboard access"""
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)  # Hashed password
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, blank=True, null=True)
    location = models.CharField(max_length=200, blank=True, null=True)
    experience = models.CharField(max_length=50, blank=True, null=True)
    skills = models.TextField(blank=True, null=True)
    qualification = models.CharField(max_length=200, blank=True, null=True)
    resume = models.FileField(upload_to=upload_resume_path, blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    portfolio_url = models.URLField(blank=True, null=True)
    education_details = models.TextField(blank=True, null=True)
    backlogs = models.IntegerField(default=0, blank=True, null=True)
    college = models.CharField(max_length=200, blank=True, null=True)
    cgpa = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True)
    tenth_percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    inter_percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    preferred_locations = models.CharField(max_length=200, blank=True, null=True)
    alternate_phone = models.CharField(max_length=20, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    current_company = models.CharField(max_length=200, blank=True, null=True)
    current_role = models.CharField(max_length=100, blank=True, null=True)
    current_ctc = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    expected_ctc = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    notice_period = models.CharField(max_length=50, blank=True, null=True)
    certifications = models.TextField(blank=True, null=True)
    tenth_school = models.CharField(max_length=200, blank=True, null=True)
    tenth_board = models.CharField(max_length=100, blank=True, null=True)
    tenth_year = models.IntegerField(blank=True, null=True)
    inter_college = models.CharField(max_length=200, blank=True, null=True)
    inter_board = models.CharField(max_length=100, blank=True, null=True)
    inter_year = models.IntegerField(blank=True, null=True)
    diploma_institution = models.CharField(max_length=200, blank=True, null=True)
    diploma_percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    diploma_year = models.IntegerField(blank=True, null=True)
    grad_degree = models.CharField(max_length=100, blank=True, null=True)
    grad_specialization = models.CharField(max_length=100, blank=True, null=True)
    grad_year = models.IntegerField(blank=True, null=True)
    pg_university = models.CharField(max_length=200, blank=True, null=True)
    pg_degree = models.CharField(max_length=100, blank=True, null=True)
    pg_cgpa = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True)
    pg_year = models.IntegerField(blank=True, null=True)
    active_backlogs = models.IntegerField(default=0, blank=True, null=True)
    cleared_backlogs = models.IntegerField(default=0, blank=True, null=True)
    grad_percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    github_profile = models.URLField(blank=True, null=True)
    willing_to_relocate = models.BooleanField(default=False, blank=True)
    is_verified = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=100, blank=True, null=True)
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'candidate_accounts'

    def __str__(self):
        return self.full_name


class Candidate(models.Model):
    """Job applicant/Candidate"""
    
    STATUS_CHOICES = (
        ('applied', 'Applied'),
        ('shortlisted', 'Shortlisted'),
        ('interview_scheduled', 'Interview Scheduled'),
        ('selected', 'Selected'),
        ('offered', 'Offer Released'),
        ('offer_accepted', 'Offer Letter Accepted'),
        ('background_verification', 'Background Verification'),
        ('joining_confirmed', 'Joining Date Confirmed'),
        ('joined', 'Joined Company'),
        ('onboarded', 'HR Onboarded / Employee Access Active'),
        ('rejected', 'Rejected'),
    )
    
    candidate_account = models.ForeignKey(CandidateAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='applications')
    job_requisition = models.ForeignKey(JobRequisition, on_delete=models.CASCADE, related_name='candidates')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    current_company = models.CharField(max_length=200, blank=True, null=True)
    current_designation = models.CharField(max_length=100, blank=True, null=True)
    resume = models.FileField(upload_to=upload_resume_path, blank=True, null=True)
    cover_letter = models.TextField(blank=True, null=True)
    source_channel = models.CharField(max_length=20, choices=(('portal', 'Portal'), ('referral', 'Referral'), ('agency', 'Agency'), ('campus', 'Campus')), default='portal')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='applied')
    applied_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'candidates'
        ordering = ['-applied_date']
        indexes = [
            models.Index(fields=['job_requisition', 'status']),
            models.Index(fields=['email']),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"


class InterviewRound(models.Model):
    """Interview round/Interview schedule"""
    
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('postponed', 'Postponed'),
        ('cancelled', 'Cancelled'),
    )
    
    INTERVIEW_TYPE_CHOICES = (
        ('phone', 'Phone Screening'),
        ('technical', 'Technical'),
        ('hr', 'HR Round'),
        ('manager', 'Manager Round'),
        ('final', 'Final Round'),
    )
    
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='interview_rounds')
    requisition = models.ForeignKey(JobRequisition, on_delete=models.CASCADE, related_name='interview_rounds', blank=True, null=True)
    interview_type = models.CharField(max_length=20, choices=INTERVIEW_TYPE_CHOICES)
    interviewer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    scheduled_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    outcome = models.CharField(max_length=20, choices=(('pass', 'Pass'), ('fail', 'Fail'), ('hold', 'Hold'), ('pending', 'Pending')), default='pending')
    feedback = models.TextField(blank=True, null=True)
    rating = models.IntegerField(blank=True, null=True, choices=[(i, i) for i in range(1, 6)])
    meeting_link = models.URLField(max_length=500, blank=True, null=True)
    communication_rating = models.IntegerField(blank=True, null=True, choices=[(i, i) for i in range(1, 6)])
    confidence_rating = models.IntegerField(blank=True, null=True, choices=[(i, i) for i in range(1, 6)])
    professionalism_rating = models.IntegerField(blank=True, null=True, choices=[(i, i) for i in range(1, 6)])
    cultural_fit_rating = models.IntegerField(blank=True, null=True, choices=[(i, i) for i in range(1, 6)])
    problem_solving_rating = models.IntegerField(blank=True, null=True, choices=[(i, i) for i in range(1, 6)])
    tech_knowledge_rating = models.IntegerField(blank=True, null=True, choices=[(i, i) for i in range(1, 6)])
    coding_rating = models.IntegerField(blank=True, null=True, choices=[(i, i) for i in range(1, 6)])
    project_experience_rating = models.IntegerField(blank=True, null=True, choices=[(i, i) for i in range(1, 6)])
    system_design_rating = models.IntegerField(blank=True, null=True, choices=[(i, i) for i in range(1, 6)])
    is_candidate_live = models.BooleanField(default=False)
    is_interviewer_live = models.BooleanField(default=False)
    candidate_last_seen = models.DateTimeField(blank=True, null=True)
    interviewer_last_seen = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='interviews_scheduled')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'interview_rounds'
        ordering = ['scheduled_date']
    
    def __str__(self):
        return f"{self.candidate.first_name} - {self.interview_type}"


class OfferLetter(models.Model):
    """Offer letter"""
    
    STATUS_CHOICES = (
        ('issued', 'Issued'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('revoked', 'Revoked'),
        ('draft', 'Draft'),
    )
    
    candidate = models.OneToOneField(Candidate, on_delete=models.CASCADE, related_name='offer_letter')
    requisition = models.ForeignKey(JobRequisition, on_delete=models.CASCADE, related_name='offer_letters', blank=True, null=True)
    position_title = models.CharField(max_length=100)
    salary = models.DecimalField(max_digits=12, decimal_places=2)
    start_date = models.DateField()
    joining_date = models.DateField(blank=True, null=True)
    issued_date = models.DateField(blank=True, null=True)
    offer_validity = models.DateField()
    document = models.FileField(upload_to=upload_offer_letter_path, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'offer_letters'
        ordering = ['-created_date']
    
    def __str__(self):
        return f"Offer - {self.candidate.first_name} {self.candidate.last_name}"


class InterviewChatMessage(models.Model):
    """Real-time synchronized chat message between external Candidate and HR Interviewer"""
    interview_round = models.ForeignKey(InterviewRound, on_delete=models.CASCADE, related_name='chat_messages')
    sender_type = models.CharField(max_length=20)  # 'candidate' or 'interviewer'
    sender_name = models.CharField(max_length=200)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'interview_chat_messages'
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender_name} ({self.sender_type}): {self.message[:30]}"


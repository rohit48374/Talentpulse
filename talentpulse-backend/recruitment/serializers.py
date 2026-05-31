# RECRUITMENT SERIALIZERS
from rest_framework import serializers
from recruitment.models import JobRequisition, Candidate, InterviewRound, OfferLetter


class JobRequisitionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    department_name = serializers.CharField(source='department_ref.name', read_only=True)
    designation_name = serializers.CharField(source='designation_ref.name', read_only=True)
    grade_name = serializers.CharField(source='grade.grade', read_only=True)
    
    class Meta:
        model = JobRequisition
        fields = ['id', 'title', 'description', 'department', 'department_ref', 'department_name', 'designation', 'designation_ref', 'designation_name',
                  'grade', 'grade_name', 'position_count', 'salary_range_min', 'salary_range_max', 'required_by',
                  'status', 'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class CandidateSerializer(serializers.ModelSerializer):
    job_requisition_title = serializers.CharField(source='job_requisition.title', read_only=True)
    education_details = serializers.CharField(source='candidate_account.education_details', read_only=True)
    backlogs = serializers.IntegerField(source='candidate_account.backlogs', read_only=True)
    skills = serializers.CharField(source='candidate_account.skills', read_only=True)
    experience = serializers.CharField(source='candidate_account.experience', read_only=True)
    linkedin_url = serializers.URLField(source='candidate_account.linkedin_url', read_only=True)
    portfolio_url = serializers.URLField(source='candidate_account.portfolio_url', read_only=True)
    college = serializers.CharField(source='candidate_account.college', read_only=True)
    cgpa = serializers.DecimalField(source='candidate_account.cgpa', max_digits=4, decimal_places=2, read_only=True)
    tenth_percentage = serializers.DecimalField(source='candidate_account.tenth_percentage', max_digits=5, decimal_places=2, read_only=True)
    inter_percentage = serializers.DecimalField(source='candidate_account.inter_percentage', max_digits=5, decimal_places=2, read_only=True)
    preferred_locations = serializers.CharField(source='candidate_account.preferred_locations', read_only=True)
    alternate_phone = serializers.CharField(source='candidate_account.alternate_phone', read_only=True)
    dob = serializers.DateField(source='candidate_account.dob', read_only=True)
    gender = serializers.CharField(source='candidate_account.gender', read_only=True)
    current_ctc = serializers.DecimalField(source='candidate_account.current_ctc', max_digits=12, decimal_places=2, read_only=True)
    expected_ctc = serializers.DecimalField(source='candidate_account.expected_ctc', max_digits=12, decimal_places=2, read_only=True)
    notice_period = serializers.CharField(source='candidate_account.notice_period', read_only=True)
    certifications = serializers.CharField(source='candidate_account.certifications', read_only=True)
    tenth_school = serializers.CharField(source='candidate_account.tenth_school', read_only=True)
    tenth_board = serializers.CharField(source='candidate_account.tenth_board', read_only=True)
    tenth_year = serializers.IntegerField(source='candidate_account.tenth_year', read_only=True)
    inter_college = serializers.CharField(source='candidate_account.inter_college', read_only=True)
    inter_board = serializers.CharField(source='candidate_account.inter_board', read_only=True)
    inter_year = serializers.IntegerField(source='candidate_account.inter_year', read_only=True)
    diploma_institution = serializers.CharField(source='candidate_account.diploma_institution', read_only=True)
    diploma_percentage = serializers.DecimalField(source='candidate_account.diploma_percentage', max_digits=5, decimal_places=2, read_only=True)
    diploma_year = serializers.IntegerField(source='candidate_account.diploma_year', read_only=True)
    grad_degree = serializers.CharField(source='candidate_account.grad_degree', read_only=True)
    grad_specialization = serializers.CharField(source='candidate_account.grad_specialization', read_only=True)
    grad_year = serializers.IntegerField(source='candidate_account.grad_year', read_only=True)
    pg_university = serializers.CharField(source='candidate_account.pg_university', read_only=True)
    pg_degree = serializers.CharField(source='candidate_account.pg_degree', read_only=True)
    pg_cgpa = serializers.DecimalField(source='candidate_account.pg_cgpa', max_digits=4, decimal_places=2, read_only=True)
    pg_year = serializers.IntegerField(source='candidate_account.pg_year', read_only=True)
    active_backlogs = serializers.IntegerField(source='candidate_account.active_backlogs', read_only=True)
    cleared_backlogs = serializers.IntegerField(source='candidate_account.cleared_backlogs', read_only=True)
    grad_percentage = serializers.DecimalField(source='candidate_account.grad_percentage', max_digits=5, decimal_places=2, read_only=True)
    github_profile = serializers.URLField(source='candidate_account.github_profile', read_only=True)
    willing_to_relocate = serializers.BooleanField(source='candidate_account.willing_to_relocate', read_only=True)
    
    class Meta:
        model = Candidate
        fields = ['id', 'job_requisition', 'job_requisition_title', 'first_name', 'last_name',
                  'email', 'phone', 'current_company', 'current_designation', 'resume',
                  'cover_letter', 'source_channel', 'status', 'education_details', 'backlogs',
                  'skills', 'experience', 'linkedin_url', 'portfolio_url', 'applied_date', 'updated_at',
                  'college', 'cgpa', 'tenth_percentage', 'inter_percentage', 'preferred_locations',
                  'alternate_phone', 'dob', 'gender', 'current_ctc', 'expected_ctc', 'notice_period',
                  'certifications', 'tenth_school', 'tenth_board', 'tenth_year', 'inter_college',
                  'inter_board', 'inter_year', 'diploma_institution', 'diploma_percentage', 'diploma_year',
                  'grad_degree', 'grad_specialization', 'grad_year', 'pg_university', 'pg_degree',
                  'pg_cgpa', 'pg_year', 'active_backlogs', 'cleared_backlogs', 'grad_percentage',
                  'github_profile', 'willing_to_relocate']
        read_only_fields = ['applied_date', 'updated_at']


class InterviewRoundSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='candidate.get_full_name', read_only=True)
    interviewer_name = serializers.CharField(source='interviewer.full_name', read_only=True)
    requisition_title = serializers.CharField(source='requisition.title', read_only=True)
    experience = serializers.CharField(source='candidate.candidate_account.experience', read_only=True, default='')
    education_details = serializers.CharField(source='candidate.candidate_account.education_details', read_only=True, default='')
    backlogs = serializers.IntegerField(source='candidate.candidate_account.backlogs', read_only=True, default=0)
    skills = serializers.CharField(source='candidate.candidate_account.skills', read_only=True, default='')
    college = serializers.CharField(source='candidate.candidate_account.college', read_only=True, default='')
    cgpa = serializers.DecimalField(source='candidate.candidate_account.cgpa', max_digits=4, decimal_places=2, read_only=True, required=False)
    tenth_percentage = serializers.DecimalField(source='candidate.candidate_account.tenth_percentage', max_digits=5, decimal_places=2, read_only=True, required=False)
    inter_percentage = serializers.DecimalField(source='candidate.candidate_account.inter_percentage', max_digits=5, decimal_places=2, read_only=True, required=False)
    preferred_locations = serializers.CharField(source='candidate.candidate_account.preferred_locations', read_only=True, default='')
    
    class Meta:
        model = InterviewRound
        fields = ['id', 'candidate', 'candidate_name', 'requisition', 'requisition_title', 'interview_type', 'interviewer',
                  'interviewer_name', 'scheduled_date', 'status', 'outcome', 'feedback', 'rating', 'meeting_link',
                  'communication_rating', 'confidence_rating', 'professionalism_rating', 'cultural_fit_rating',
                  'problem_solving_rating', 'tech_knowledge_rating', 'coding_rating', 'project_experience_rating', 'system_design_rating',
                  'experience', 'education_details', 'backlogs', 'skills',
                  'college', 'cgpa', 'tenth_percentage', 'inter_percentage', 'preferred_locations',
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class OfferLetterSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='candidate.get_full_name', read_only=True)
    requisition_title = serializers.CharField(source='requisition.title', read_only=True)
    
    class Meta:
        model = OfferLetter
        fields = ['id', 'candidate', 'candidate_name', 'requisition', 'requisition_title', 'position_title', 'salary',
                  'start_date', 'joining_date', 'issued_date', 'offer_validity', 'document', 'status',
                  'created_date', 'updated_at']
        read_only_fields = ['created_date', 'updated_at']


from recruitment.models import CandidateAccount
from django.contrib.auth.hashers import make_password

class CandidateAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = CandidateAccount
        fields = ['id', 'email', 'full_name', 'phone', 'location', 'experience', 'skills', 'qualification', 'resume', 
                  'linkedin_url', 'portfolio_url', 'education_details', 'backlogs', 'college', 'cgpa', 
                  'tenth_percentage', 'inter_percentage', 'preferred_locations', 'alternate_phone', 'dob',
                  'gender', 'current_company', 'current_role', 'current_ctc', 'expected_ctc', 'notice_period',
                  'certifications', 'tenth_school', 'tenth_board', 'tenth_year', 'inter_college', 'inter_board',
                  'inter_year', 'diploma_institution', 'diploma_percentage', 'diploma_year', 'grad_degree',
                  'grad_specialization', 'grad_year', 'pg_university', 'pg_degree', 'pg_cgpa', 'pg_year',
                  'active_backlogs', 'cleared_backlogs', 'grad_percentage', 'github_profile', 'willing_to_relocate', 'created_at']
        read_only_fields = ['id', 'email', 'created_at']


class CandidateRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = CandidateAccount
        fields = ['id', 'email', 'password', 'full_name', 'phone']

    def validate_email(self, value):
        if CandidateAccount.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return value

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)


class CareersJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobRequisition
        fields = ['id', 'title', 'description', 'department', 'designation', 'salary_range_min', 'salary_range_max', 'required_by', 'status', 'created_at']

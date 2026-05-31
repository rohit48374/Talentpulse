# EMPLOYEES SERIALIZERS

from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from employees.models import (
    Department, Designation, GradeStructure, EmployeeProfile,
    EmployeeEducation, EmployeeExperience, EmployeeSkill, Grievance
)


class DepartmentSerializer(serializers.ModelSerializer):
    designations = serializers.SlugRelatedField(many=True, read_only=True, slug_field='name')
    head_name = serializers.SerializerMethodField()
    hrbp_user_name = serializers.SerializerMethodField()
    # Override name to fix DRF unique-validator firing on self during PUT updates.
    # The UniqueValidator is re-attached with instance exclusion in validate().
    name = serializers.CharField(max_length=100)
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'head', 'head_name', 'budget', 'designations', 'cost_centre_code', 'hrbp_user', 'hrbp_user_name', 'status', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def validate_name(self, value):
        # On update (PUT/PATCH), exclude self from unique check.
        instance = self.instance
        qs = Department.objects.filter(name=value)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A department with this name already exists.")
        return value

    def get_head_name(self, obj):
        if obj.head:
            return obj.head.full_name or obj.head.email
        return None

    def get_hrbp_user_name(self, obj):
        if obj.hrbp_user:
            return obj.hrbp_user.full_name or obj.hrbp_user.email
        return None


class DesignationSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    # Override name to fix DRF unique-validator firing on self during PUT updates.
    name = serializers.CharField(max_length=100)
    
    class Meta:
        model = Designation
        fields = ['id', 'name', 'description', 'department', 'department_name', 'grade',
                  'salary_range_min', 'salary_range_max', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def validate_name(self, value):
        # On update, exclude self from unique check.
        instance = self.instance
        qs = Designation.objects.filter(name=value)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A designation with this name already exists.")
        return value


class GradeStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeStructure
        fields = ['id', 'grade', 'level', 'base_salary', 'band', 'min_salary', 'max_salary', 'leave_entitlement', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class EmployeeEducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeEducation
        fields = ['id', 'institution', 'qualification', 'field_of_study', 'start_date',
                  'end_date', 'grade_or_score']


class EmployeeExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeExperience
        fields = ['id', 'company_name', 'designation', 'start_date', 'end_date', 'description']


class EmployeeSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeSkill
        fields = ['id', 'skill_name', 'proficiency', 'years_of_experience']


class EmployeeProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    education_history = EmployeeEducationSerializer(many=True, read_only=True)
    experience_history = EmployeeExperienceSerializer(many=True, read_only=True)
    skills = EmployeeSkillSerializer(many=True, read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_name = serializers.CharField(source='designation.name', read_only=True)
    grade_name = serializers.CharField(source='grade.grade', read_only=True)
    grade_base_salary = serializers.DecimalField(source='grade.base_salary', max_digits=12, decimal_places=2, read_only=True)
    user_profile_image = serializers.SerializerMethodField()
    reporting_manager_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EmployeeProfile
        fields = [
            'id', 'user', 'user_email', 'user_full_name', 'user_role', 'user_profile_image', 'department', 'department_name',
            'designation', 'designation_name', 'grade', 'grade_name', 'grade_base_salary', 'reporting_manager', 'reporting_manager_name', 'gender',
            'date_of_birth', 'contact_number', 'personal_email', 'emergency_contact',
            'emergency_phone', 'office_location', 'work_phone', 'pan_number',
            'aadhar_number', 'passport_number', 'joining_date', 'employment_type', 'status',
            'education_history', 'experience_history', 'skills', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_reporting_manager_name(self, obj):
        if obj.reporting_manager:
            return obj.reporting_manager.full_name
        return None

    def get_user_profile_image(self, obj):
        if obj.user.profile_image:
            return obj.user.profile_image.url
        return None


class EmployeeProfilePublicSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_name = serializers.CharField(source='designation.name', read_only=True)
    user_profile_image = serializers.SerializerMethodField()
    reporting_manager_name = serializers.SerializerMethodField()
    skills = EmployeeSkillSerializer(many=True, read_only=True)
    education_history = EmployeeEducationSerializer(many=True, read_only=True)
    experience_history = EmployeeExperienceSerializer(many=True, read_only=True)
    
    class Meta:
        model = EmployeeProfile
        fields = [
            'id', 'user', 'user_email', 'user_full_name', 'user_profile_image', 
            'department', 'department_name', 'designation', 'designation_name', 
            'reporting_manager', 'reporting_manager_name', 'office_location', 
            'work_phone', 'joining_date', 'employment_type', 'status',
            'skills', 'education_history', 'experience_history'
        ]
        
    def get_reporting_manager_name(self, obj):
        if obj.reporting_manager:
            return obj.reporting_manager.full_name
        return None

    def get_user_profile_image(self, obj):
        if obj.user.profile_image:
            return obj.user.profile_image.url
        return None


class GrievanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_email = serializers.CharField(source='employee.email', read_only=True)
    assigned_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Grievance
        fields = [
            'id', 'employee', 'employee_name', 'employee_email', 'title', 'category', 'category_display',
            'description', 'status', 'status_display', 'assigned_to', 'assigned_name', 
            'resolution_details', 'created_at', 'resolved_at'
        ]
        read_only_fields = ['employee', 'created_at', 'resolved_at']

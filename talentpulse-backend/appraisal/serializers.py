# APPRAISAL SERIALIZERS
from rest_framework import serializers
from appraisal.models import AppraisalCycle, GoalSheet, EmployeeAppraisal, PromotionRecommendation


class AppraisalCycleSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    
    class Meta:
        model = AppraisalCycle
        fields = ['id', 'name', 'description', 'start_date', 'end_date', 'status',
                  'financial_year', 'year', 'cycle_type', 'goal_setting_start', 'goal_setting_end',
                  'review_start', 'review_end', 'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class GoalSheetSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    manager_name = serializers.CharField(source='manager.full_name', read_only=True)
    
    class Meta:
        model = GoalSheet
        fields = ['id', 'appraisal_cycle', 'employee', 'employee_name', 'employee_id', 'manager', 'manager_name',
                  'goal_title', 'goal_description', 'target_value', 'weight', 'status',
                  'manager_comments', 'actual_value', 'achievement_percentage',
                  'goals_json', 'self_rating', 'manager_rating', 'final_rating',
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class EmployeeAppraisalSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    manager_name = serializers.CharField(source='manager.full_name', read_only=True)
    
    class Meta:
        model = EmployeeAppraisal
        fields = ['id', 'appraisal_cycle', 'employee', 'employee_name', 'employee_id', 'manager',
                  'manager_name', 'status', 'self_rating', 'self_comments',
                  'manager_rating', 'manager_comments', 'final_rating',
                  'performance_remarks', 'strengths', 'areas_for_improvement',
                  'development_plan', 'submitted_at', 'completed_at',
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PromotionRecommendationSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)
    current_grade_name = serializers.CharField(source='current_grade.grade', read_only=True)
    recommended_grade_name = serializers.CharField(source='recommended_grade.grade', read_only=True)
    recommended_by_name = serializers.CharField(source='recommended_by.full_name', read_only=True)
    
    class Meta:
        model = PromotionRecommendation
        fields = ['id', 'employee', 'employee_name', 'employee_id', 'appraisal_cycle',
                  'current_designation', 'recommended_designation', 'reason', 'status',
                  'approved_by', 'approved_by_name', 'current_grade', 'current_grade_name',
                  'recommended_grade', 'recommended_grade_name', 'recommended_by', 'recommended_by_name',
                  'salary_increment_percentage', 'effective_date', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


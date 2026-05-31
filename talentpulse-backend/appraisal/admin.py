from django.contrib import admin
from appraisal.models import AppraisalCycle, GoalSheet, EmployeeAppraisal, PromotionRecommendation


@admin.register(AppraisalCycle)
class AppraisalCycleAdmin(admin.ModelAdmin):
    list_display = ['name', 'financial_year', 'start_date', 'end_date', 'status']
    list_filter = ['status', 'financial_year']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(GoalSheet)
class GoalSheetAdmin(admin.ModelAdmin):
    list_display = ['employee', 'appraisal_cycle', 'goal_title', 'weight', 'status']
    list_filter = ['status', 'appraisal_cycle']
    search_fields = ['employee__email', 'goal_title']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(EmployeeAppraisal)
class EmployeeAppraisalAdmin(admin.ModelAdmin):
    list_display = ['employee', 'appraisal_cycle', 'manager', 'final_rating', 'status']
    list_filter = ['status', 'final_rating']
    search_fields = ['employee__email', 'employee__full_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(PromotionRecommendation)
class PromotionRecommendationAdmin(admin.ModelAdmin):
    list_display = ['employee', 'current_designation', 'recommended_designation', 'status', 'effective_date']
    list_filter = ['status', 'effective_date']
    search_fields = ['employee__email', 'employee__full_name']
    readonly_fields = ['created_at', 'updated_at']

from django.contrib import admin
from employees.models import Department, Designation, GradeStructure, EmployeeProfile, EmployeeEducation, EmployeeExperience, EmployeeSkill


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'head', 'budget', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Designation)
class DesignationAdmin(admin.ModelAdmin):
    list_display = ['name', 'department', 'grade', 'salary_range_min', 'salary_range_max']
    list_filter = ['department']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(GradeStructure)
class GradeStructureAdmin(admin.ModelAdmin):
    list_display = ['grade', 'level', 'base_salary']
    list_filter = ['level']
    search_fields = ['grade']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'department', 'designation', 'reporting_manager', 'gender']
    list_filter = ['department', 'gender']
    search_fields = ['user__email', 'user__full_name', 'pan_number']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(EmployeeEducation)
class EmployeeEducationAdmin(admin.ModelAdmin):
    list_display = ['employee', 'institution', 'qualification', 'end_date']
    list_filter = ['qualification', 'end_date']
    search_fields = ['employee__user__email', 'institution']


@admin.register(EmployeeExperience)
class EmployeeExperienceAdmin(admin.ModelAdmin):
    list_display = ['employee', 'company_name', 'designation', 'end_date']
    list_filter = ['end_date']
    search_fields = ['employee__user__email', 'company_name']


@admin.register(EmployeeSkill)
class EmployeeSkillAdmin(admin.ModelAdmin):
    list_display = ['employee', 'skill_name', 'proficiency', 'years_of_experience']
    list_filter = ['proficiency']
    search_fields = ['employee__user__email', 'skill_name']

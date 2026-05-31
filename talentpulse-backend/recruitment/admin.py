from django.contrib import admin
from recruitment.models import JobRequisition, Candidate, InterviewRound, OfferLetter


@admin.register(JobRequisition)
class JobRequisitionAdmin(admin.ModelAdmin):
    list_display = ['title', 'department', 'position_count', 'status', 'created_at']
    list_filter = ['status', 'department', 'created_at']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'email', 'job_requisition', 'status', 'applied_date']
    list_filter = ['status', 'applied_date', 'job_requisition']
    search_fields = ['email', 'first_name', 'last_name']
    readonly_fields = ['applied_date', 'updated_at']


@admin.register(InterviewRound)
class InterviewRoundAdmin(admin.ModelAdmin):
    list_display = ['candidate', 'interview_type', 'interviewer', 'scheduled_date', 'status']
    list_filter = ['interview_type', 'status', 'scheduled_date']
    search_fields = ['candidate__first_name', 'candidate__email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(OfferLetter)
class OfferLetterAdmin(admin.ModelAdmin):
    list_display = ['candidate', 'position_title', 'salary', 'offer_validity', 'status']
    list_filter = ['status', 'offer_validity']
    search_fields = ['candidate__first_name', 'candidate__email']
    readonly_fields = ['created_date', 'updated_at']

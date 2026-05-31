from django.urls import path, include
from rest_framework.routers import DefaultRouter
from recruitment.views import (
    JobRequisitionViewSet, CandidateViewSet, InterviewRoundViewSet, OfferLetterViewSet
)
from recruitment.careers_views import (
    CandidateRegisterView, CandidateLoginView, CandidateProfileView,
    CareersJobsListView, CareersJobDetailView, CareersApplyView,
    CareersApplicationsView, CareersInterviewsView, CareersOffersView, CareersInterviewChatView,
    VerifyEmailView, CareersForgotPasswordView, CareersResetPasswordView, CareersInterviewPresenceView
)

router = DefaultRouter()
router.register(r'job-requisitions', JobRequisitionViewSet, basename='job-requisition')
router.register(r'candidates', CandidateViewSet, basename='candidate')
router.register(r'interview-rounds', InterviewRoundViewSet, basename='interview-round')
router.register(r'offer-letters', OfferLetterViewSet, basename='offer-letter')

urlpatterns = [
    path('', include(router.urls)),
    
    # Dedicated Candidate Portal Careers APIs
    path('careers/auth/register/', CandidateRegisterView.as_view(), name='candidate-register'),
    path('careers/auth/login/', CandidateLoginView.as_view(), name='candidate-login'),
    path('careers/auth/verify/', VerifyEmailView.as_view(), name='candidate-verify'),
    path('careers/auth/forgot-password/', CareersForgotPasswordView.as_view(), name='candidate-forgot-password'),
    path('careers/auth/reset-password/', CareersResetPasswordView.as_view(), name='candidate-reset-password'),
    path('careers/profile/', CandidateProfileView.as_view(), name='candidate-profile'),
    path('careers/jobs/', CareersJobsListView.as_view(), name='careers-jobs-list'),
    path('careers/jobs/<int:pk>/', CareersJobDetailView.as_view(), name='careers-job-detail'),
    path('careers/applications/apply/', CareersApplyView.as_view(), name='careers-apply'),
    path('careers/applications/', CareersApplicationsView.as_view(), name='careers-applications'),
    path('careers/interviews/', CareersInterviewsView.as_view(), name='careers-interviews'),
    path('careers/offers/', CareersOffersView.as_view(), name='careers-offers'),
    path('careers/interviews/<int:round_id>/chat/', CareersInterviewChatView.as_view(), name='careers-interview-chat'),
    path('careers/interviews/<int:round_id>/presence/', CareersInterviewPresenceView.as_view(), name='careers-interview-presence'),
]

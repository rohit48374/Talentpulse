from django.urls import path, include
from rest_framework.routers import DefaultRouter
from appraisal.views import (
    AppraisalCycleViewSet, GoalSheetViewSet, EmployeeAppraisalViewSet,
    PromotionRecommendationViewSet
)

router = DefaultRouter()
router.register(r'cycles', AppraisalCycleViewSet, basename='appraisal-cycle')
router.register(r'goals', GoalSheetViewSet, basename='goal-sheet')
router.register(r'appraisals', EmployeeAppraisalViewSet, basename='employee-appraisal')
router.register(r'promotions', PromotionRecommendationViewSet, basename='promotion')

urlpatterns = [
    path('', include(router.urls)),
]

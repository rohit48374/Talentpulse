from django.urls import path, include
from rest_framework.routers import DefaultRouter
from analytics.views import AnalyticsSnapshotViewSet, DepartmentAnalyticsViewSet, HRReportViewSet

router = DefaultRouter()
router.register(r'snapshots', AnalyticsSnapshotViewSet, basename='analytics-snapshot')
router.register(r'department', DepartmentAnalyticsViewSet, basename='department-analytics')
router.register(r'reports', HRReportViewSet, basename='hr-reports')

urlpatterns = [
    path('', include(router.urls)),
]

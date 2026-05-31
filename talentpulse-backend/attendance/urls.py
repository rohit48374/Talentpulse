from django.urls import path, include
from rest_framework.routers import DefaultRouter
from attendance.views import (
    LeaveTypeViewSet, LeaveBalanceViewSet, LeaveApplicationViewSet,
    AttendanceRecordViewSet, CheckInOutViewSet
)

router = DefaultRouter()
router.register(r'leave-types', LeaveTypeViewSet, basename='leave-type')
router.register(r'leave-balances', LeaveBalanceViewSet, basename='leave-balance')
router.register(r'leave-applications', LeaveApplicationViewSet, basename='leave-application')
router.register(r'attendance', AttendanceRecordViewSet, basename='attendance')
router.register(r'check-in-out', CheckInOutViewSet, basename='check-in-out')

urlpatterns = [
    path('', include(router.urls)),
]

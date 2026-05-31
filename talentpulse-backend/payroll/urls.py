from django.urls import path, include
from rest_framework.routers import DefaultRouter
from payroll.views import (
    SalaryStructureViewSet, PayrollRunViewSet, PayslipViewSet, BonusViewSet
)

router = DefaultRouter()
router.register(r'salary-structures', SalaryStructureViewSet, basename='salary-structure')
router.register(r'payroll-runs', PayrollRunViewSet, basename='payroll-run')
router.register(r'payslips', PayslipViewSet, basename='payslip')
router.register(r'bonuses', BonusViewSet, basename='bonus')

urlpatterns = [
    path('', include(router.urls)),
]

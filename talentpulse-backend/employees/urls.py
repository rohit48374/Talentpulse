from django.urls import path, include
from rest_framework.routers import DefaultRouter
from employees.views import (
    DepartmentViewSet, DesignationViewSet, GradeStructureViewSet,
    EmployeeProfileViewSet, EmployeeEducationViewSet, EmployeeExperienceViewSet,
    EmployeeSkillViewSet, GrievanceViewSet
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'designations', DesignationViewSet, basename='designation')
router.register(r'grades', GradeStructureViewSet, basename='grade')
router.register(r'profiles', EmployeeProfileViewSet, basename='employee-profile')
router.register(r'education', EmployeeEducationViewSet, basename='education')
router.register(r'experience', EmployeeExperienceViewSet, basename='experience')
router.register(r'skills', EmployeeSkillViewSet, basename='skill')
router.register(r'grievances', GrievanceViewSet, basename='grievance')

urlpatterns = [
    path('', include(router.urls)),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from dashboard.views import (
    DashboardViewSet, DashboardCardViewSet,
    EmployeeDashboardView, EmployeeProfileView, LeaveApplyView, AttendanceMeView, PayslipsMeView, NotificationsMeView,
    ManagerDashboardView, ManagerTeamView, ManagerLeaveRequestsView, ManagerApproveLeaveView, ManagerPerformanceView, ManagerTeamAttendanceView,
    HRDashboardView, HRAllEmployeesView, HREmployeeCreateView, HREmployeeUpdateView, HRDepartmentsListView, HRAnalyticsSnapshotView, HRRecruitmentOverviewView,
    RecruiterDashboardView, RecruiterJobCreateView, RecruiterCandidatesListView, RecruiterScheduleInterviewView, RecruiterOfferCreateView, RecruiterAnalyticsView,
    PayrollDashboardView, PayrollProcessView, PayrollSalaryStructuresView, PayrollPayslipsListView, PayrollGeneratePayslipsView, PayrollReportsView,
    AdminDashboardView, AdminUsersListView, AdminUserCreateView, AdminAssignRoleView, AdminAuditLogsView, AdminSystemAnalyticsView, AdminSecurityLogsView,
    RoleGovernanceView, RoleUserActionView
)

router = DefaultRouter()
router.register(r'cards', DashboardCardViewSet, basename='dashboard-card')

urlpatterns = [
    # Router views (dashboard cards)
    path('', include(router.urls)),
    
    # Central role-based dashboard
    path('dashboard/', DashboardViewSet.as_view({'get': 'dashboard'}), name='central-dashboard'),
    
    # Employee dashboard specific APIs
    path('employee/dashboard/', EmployeeDashboardView.as_view(), name='employee-dashboard-api'),
    path('employee/profile/', EmployeeProfileView.as_view(), name='employee-profile-api'),
    path('leave/apply/', LeaveApplyView.as_view(), name='leave-apply-api'),
    path('attendance/me/', AttendanceMeView.as_view(), name='attendance-me-api'),
    path('payslips/me/', PayslipsMeView.as_view(), name='payslips-me-api'),
    path('notifications/me/', NotificationsMeView.as_view(), name='notifications-me-api'),
    
    # Manager dashboard specific APIs
    path('manager/dashboard/', ManagerDashboardView.as_view(), name='manager-dashboard-api'),
    path('manager/team/', ManagerTeamView.as_view(), name='manager-team-api'),
    path('manager/leave-requests/', ManagerLeaveRequestsView.as_view(), name='manager-leave-requests-api'),
    path('manager/approve-leave/', ManagerApproveLeaveView.as_view(), name='manager-approve-leave-api'),
    path('manager/performance/', ManagerPerformanceView.as_view(), name='manager-performance-api'),
    path('manager/team-attendance/', ManagerTeamAttendanceView.as_view(), name='manager-team-attendance-api'),
    
    # HR dashboard specific APIs
    path('hr/dashboard/', HRDashboardView.as_view(), name='hr-dashboard-api'),
    path('employees/', HRAllEmployeesView.as_view(), name='hr-employees-api'),
    path('employees/create/', HREmployeeCreateView.as_view(), name='hr-employees-create-api'),
    path('employees/update/<int:pk>/', HREmployeeUpdateView.as_view(), name='hr-employees-update-api'),
    path('departments/', HRDepartmentsListView.as_view(), name='hr-departments-api'),
    path('analytics/hr/', HRAnalyticsSnapshotView.as_view(), name='hr-analytics-api'),
    path('recruitment/overview/', HRRecruitmentOverviewView.as_view(), name='hr-recruitment-overview-api'),
    
    # Recruiter dashboard specific APIs
    path('recruiter/dashboard/', RecruiterDashboardView.as_view(), name='recruiter-dashboard-api'),
    path('jobs/create/', RecruiterJobCreateView.as_view(), name='recruiter-jobs-create-api'),
    path('candidates/', RecruiterCandidatesListView.as_view(), name='recruiter-candidates-api'),
    path('interviews/schedule/', RecruiterScheduleInterviewView.as_view(), name='recruiter-interviews-schedule-api'),
    path('offers/create/', RecruiterOfferCreateView.as_view(), name='recruiter-offers-create-api'),
    path('recruitment/analytics/', RecruiterAnalyticsView.as_view(), name='recruiter-recruitment-analytics-api'),
    
    # Payroll dashboard specific APIs
    path('payroll/dashboard/', PayrollDashboardView.as_view(), name='payroll-dashboard-api'),
    path('payroll/process/', PayrollProcessView.as_view(), name='payroll-process-api'),
    path('salary-structures/', PayrollSalaryStructuresView.as_view(), name='payroll-salary-structures-api'),
    path('payslips/', PayrollPayslipsListView.as_view(), name='payroll-payslips-api'),
    path('payslips/generate/', PayrollGeneratePayslipsView.as_view(), name='payroll-payslips-generate-api'),
    path('payroll/reports/', PayrollReportsView.as_view(), name='payroll-reports-api'),
    
    # Admin dashboard specific APIs
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard-api'),
    path('users/', AdminUsersListView.as_view(), name='admin-users-api'),
    path('users/create/', AdminUserCreateView.as_view(), name='admin-users-create-api'),
    path('roles/assign/', AdminAssignRoleView.as_view(), name='admin-roles-assign-api'),
    path('roles/governance/', RoleGovernanceView.as_view(), name='admin-roles-governance-api'),
    path('roles/governance/action/', RoleUserActionView.as_view(), name='admin-roles-governance-action-api'),
    path('audit-logs/', AdminAuditLogsView.as_view(), name='admin-audit-logs-api'),
    path('system/analytics/', AdminSystemAnalyticsView.as_view(), name='admin-system-analytics-api'),
    path('security/logs/', AdminSecurityLogsView.as_view(), name='admin-security-logs-api'),
]

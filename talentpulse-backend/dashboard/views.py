# Centralized Dashboard Engine and Role-Specific API Views
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count, Q
from django.utils import timezone
from decimal import Decimal
import datetime

# Models imports
from dashboard.models import DashboardCard
from accounts.models import AuditLog
from notifications.models import Notification
from employees.models import Department, Designation, GradeStructure, EmployeeProfile
from attendance.models import LeaveType, LeaveBalance, LeaveApplication, AttendanceRecord, CheckInOut
from payroll.models import SalaryStructure, PayrollRun, Payslip, Bonus
from recruitment.models import JobRequisition, Candidate, InterviewRound, OfferLetter
from appraisal.models import AppraisalCycle, GoalSheet, EmployeeAppraisal, PromotionRecommendation

# Serializers imports
from dashboard.serializers import DashboardCardSerializer
from accounts.serializers import UserSerializer, AuditLogSerializer
from employees.serializers import EmployeeProfileSerializer, DepartmentSerializer, DesignationSerializer
from attendance.serializers import LeaveApplicationSerializer, AttendanceRecordSerializer
from payroll.serializers import PayslipSerializer, SalaryStructureSerializer, PayrollRunSerializer
from recruitment.serializers import JobRequisitionSerializer, CandidateSerializer, InterviewRoundSerializer, OfferLetterSerializer
from notifications.serializers import NotificationSerializer

User = get_user_model()


class DashboardViewSet(viewsets.ViewSet):
    """
    Centralized Dashboard Engine.
    Detects logged-in user role and returns dynamic cards, widgets,
    sidebar menus, quick actions, notifications, and permissions.
    """
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        user = request.user
        role = user.role.lower()
        if role in ['hrbp', 'hr_admin']:
            role = 'hr'
        elif role in ['super_admin']:
            role = 'admin'
        
        # Base response structure
        response_data = {
            "role": role,
            "stats_cards": [],
            "widgets": [],
            "sidebar_menus": [],
            "quick_actions": [],
            "notifications": [],
            "permissions": []
        }

        # Populate notifications
        recent_notifs = Notification.objects.filter(recipient=user, status='unread')[:5]
        response_data["notifications"] = NotificationSerializer(recent_notifs, many=True).data

        # 1. EMPLOYEE DASHBOARD
        if role == 'employee':
            # Stats Cards
            present_days = AttendanceRecord.objects.filter(employee=user, status='present', date__month=datetime.date.today().month).count()
            remaining_leaves = 0
            leave_balances = LeaveBalance.objects.filter(employee=user)
            for b in leave_balances:
                remaining_leaves += b.available_days
                
            pending_requests = LeaveApplication.objects.filter(employee=user, status='pending').count()
            latest_payslip = Payslip.objects.filter(employee=user, status='disbursed').first()
            payslip_str = f"₹{latest_payslip.net_salary}" if latest_payslip else "No payslip yet"

            response_data["stats_cards"] = [
                {"title": "Present Days", "value": str(present_days), "icon": "CheckSquare", "trend": "This month", "color": "emerald"},
                {"title": "Remaining Leaves", "value": str(remaining_leaves), "icon": "Calendar", "trend": "FY 2025-2026", "color": "blue"},
                {"title": "Pending Requests", "value": str(pending_requests), "icon": "Clock", "trend": "Awaiting approval", "color": "amber"},
                {"title": "Latest Payslip", "value": payslip_str, "icon": "FileText", "trend": latest_payslip.payroll_run.month_year if latest_payslip else "N/A", "color": "purple"}
            ]

            # Widgets
            response_data["widgets"] = [
                {
                    "type": "attendance_summary",
                    "title": "Attendance Summary",
                    "data": {
                        "present": present_days,
                        "absent": AttendanceRecord.objects.filter(employee=user, status='absent', date__month=datetime.date.today().month).count(),
                        "leave": AttendanceRecord.objects.filter(employee=user, status='leave', date__month=datetime.date.today().month).count()
                    }
                },
                {
                    "type": "leave_balance",
                    "title": "Leave Balance Chart",
                    "data": [
                        {"type": b.leave_type.name, "total": b.total_days, "used": b.used_days, "available": b.available_days}
                        for b in leave_balances
                    ]
                },
                {
                    "type": "upcoming_holidays",
                    "title": "Upcoming Holidays",
                    "data": [
                        {"name": "Independence Day", "date": "2026-08-15"},
                        {"name": "Diwali", "date": "2026-11-08"}
                    ]
                }
            ]

            # Sidebar
            response_data["sidebar_menus"] = [
                {"title": "Dashboard", "path": "/dashboard", "icon": "LayoutDashboard"},
                {"title": "My Profile", "path": "/profile", "icon": "User"},
                {"title": "Attendance", "path": "/attendance", "icon": "Clock"},
                {"title": "Leave Management", "path": "/leaves", "icon": "Calendar"},
                {"title": "Payslips", "path": "/payslips", "icon": "FileText"},
                {"title": "Appraisal", "path": "/appraisal", "icon": "TrendingUp"},
                {"title": "Notifications", "path": "/notifications", "icon": "Bell"},
                {"title": "Settings", "path": "/settings", "icon": "Settings"}
            ]

            # Quick Actions
            response_data["quick_actions"] = [
                {"title": "Apply Leave", "action": "apply_leave", "path": "/leaves/apply"},
                {"title": "Check In / Out", "action": "check_in_out", "path": "/attendance"},
                {"title": "Download Payslip", "action": "download_latest_payslip", "path": "/payslips"}
            ]

            # Permissions
            response_data["permissions"] = ["view_own_profile", "apply_leave", "view_attendance", "download_own_payslip", "view_own_appraisal"]

        # 2. MANAGER DASHBOARD
        elif role == 'manager':
            team_members = User.objects.filter(employee_profile__reporting_manager=user)
            team_count = team_members.count()
            pending_leaves = LeaveApplication.objects.filter(employee__employee_profile__reporting_manager=user, status='pending').count()
            team_attendance_today = AttendanceRecord.objects.filter(employee__employee_profile__reporting_manager=user, date=datetime.date.today(), status='present').count()
            att_rate = f"{round((team_attendance_today / team_count) * 100, 1)}%" if team_count > 0 else "100%"
            pending_appraisals = EmployeeAppraisal.objects.filter(manager=user, status='manager_review').count()

            response_data["stats_cards"] = [
                {"title": "Team Strength", "value": str(team_count), "icon": "Users", "trend": "Active members", "color": "blue"},
                {"title": "Pending Leave Requests", "value": str(pending_leaves), "icon": "Clock", "trend": "Action required", "color": "amber"},
                {"title": "Attendance Rate", "value": att_rate, "icon": "CheckSquare", "trend": "Today's rate", "color": "emerald"},
                {"title": "Pending Reviews", "value": str(pending_appraisals), "icon": "TrendingUp", "trend": "Appraisal reviews", "color": "rose"}
            ]

            # Calculate actual team attendance rate for the last 5 weekdays
            today = datetime.date.today()
            workdays = []
            curr = today
            while len(workdays) < 5:
                if curr.weekday() < 5:  # Monday to Friday
                    workdays.append(curr)
                curr -= datetime.timedelta(days=1)
            workdays.reverse()

            team_att_data = []
            for day in workdays:
                day_name = day.strftime('%a')
                present_count = AttendanceRecord.objects.filter(
                    employee__employee_profile__reporting_manager=user,
                    date=day,
                    status='present'
                ).count()
                team_att_data.append({"day": day_name, "present": present_count})

            response_data["widgets"] = [
                {
                    "type": "team_attendance",
                    "title": "Team Attendance (Last 5 Days)",
                    "data": team_att_data
                },
                {
                    "type": "employees_on_leave",
                    "title": "Employees on Leave Today",
                    "data": [
                        {"name": lv.employee.full_name, "type": lv.leave_type.name, "days": lv.number_of_days}
                        for lv in LeaveApplication.objects.filter(employee__employee_profile__reporting_manager=user, status='approved', start_date__lte=datetime.date.today(), end_date__gte=datetime.date.today())
                    ]
                },
                {
                    "type": "team_members_list",
                    "title": "My Team Members",
                    "data": [
                        {
                            "id": member.id,
                            "full_name": member.full_name,
                            "email": member.email,
                            "phone": member.phone,
                            "designation": getattr(getattr(member, 'employee_profile', None), 'designation', None).name if getattr(getattr(member, 'employee_profile', None), 'designation', None) else 'Team Associate',
                            "department": getattr(getattr(member, 'employee_profile', None), 'department', None).name if getattr(getattr(member, 'employee_profile', None), 'department', None) else 'General',
                            "profile_image": member.profile_image.url if member.profile_image else None,
                            "status": getattr(getattr(member, 'employee_profile', None), 'status', 'active')
                        }
                        for member in team_members
                    ]
                }
            ]

            response_data["sidebar_menus"] = [
                {"title": "Dashboard", "path": "/dashboard", "icon": "LayoutDashboard"},
                {"title": "Team Attendance", "path": "/team-attendance", "icon": "Clock"},
                {"title": "Leave Approvals", "path": "/leave-approvals", "icon": "CheckSquare"},
                {"title": "Performance Reviews", "path": "/team-performance", "icon": "TrendingUp"},
                {"title": "Employees", "path": "/team-employees", "icon": "Users"},
                {"title": "Reports", "path": "/team-reports", "icon": "BarChart"},
                {"title": "Notifications", "path": "/notifications", "icon": "Bell"}
            ]

            response_data["quick_actions"] = [
                {"title": "Approve Leaves", "action": "approve_leaves", "path": "/leave-approvals"},
                {"title": "Review Performance", "action": "review_appraisals", "path": "/team-performance"}
            ]

            response_data["permissions"] = ["approve_leave", "reject_leave", "view_team_attendance", "review_appraisal", "view_team_profiles"]

        # 3. HR DASHBOARD (HRBP & HR)
        elif role == 'hr':
            total_employees = User.objects.filter(is_active=True).count()
            active_recruitments = JobRequisition.objects.filter(status='open').count()
            exited_emp = User.objects.filter(status='exited').count()
            attrition = f"{round((exited_emp / total_employees) * 100, 1)}%" if total_employees > 0 else "0.0%"
            dept_count = Department.objects.count()

            response_data["stats_cards"] = [
                {"title": "Total Employees", "value": str(total_employees), "icon": "Users", "trend": "Active headcount", "color": "indigo"},
                {"title": "Active Recruitments", "value": str(active_recruitments), "icon": "Briefcase", "trend": "Open openings", "color": "amber"},
                {"title": "Attrition Rate", "value": attrition, "icon": "TrendingDown", "trend": "Annual YTD", "color": "emerald"},
                {"title": "Departments", "value": str(dept_count), "icon": "Folder", "trend": "Configured", "color": "purple"}
            ]

            response_data["widgets"] = [
                {
                    "type": "department_statistics",
                    "title": "Department Headcount",
                    "data": [
                        {"name": dept.name, "value": User.objects.filter(employee_profile__department=dept).count()}
                        for dept in Department.objects.all()
                    ]
                },
                {
                    "type": "new_joiners",
                    "title": "New Joiners This Month",
                    "data": [
                        {"name": u.full_name, "role": u.role, "joining_date": u.joining_date}
                        for u in User.objects.filter(joining_date__month=datetime.date.today().month)[:5]
                    ]
                }
            ]

            response_data["sidebar_menus"] = [
                {"title": "Dashboard", "path": "/dashboard", "icon": "LayoutDashboard"},
                {"title": "Employees", "path": "/employees", "icon": "Users"},
                {"title": "Departments", "path": "/departments", "icon": "Folder"},
                {"title": "Recruitment", "path": "/recruitment", "icon": "Briefcase"},
                {"title": "Attendance", "path": "/attendance", "icon": "Clock"},
                {"title": "Leave Management", "path": "/leaves", "icon": "Calendar"},
                {"title": "Reports & Analytics", "path": "/reports", "icon": "BarChart"},
                {"title": "Notifications", "path": "/notifications", "icon": "Bell"},
                {"title": "Settings", "path": "/settings", "icon": "Settings"}
            ]

            response_data["quick_actions"] = [
                {"title": "Create Employee", "action": "create_employee", "path": "/employees/create"},
                {"title": "Post Job Requisition", "action": "create_job", "path": "/recruitment/requisitions/create"},
                {"title": "Configure Leave", "action": "configure_leave", "path": "/leaves/config"}
            ]

            response_data["permissions"] = ["manage_employees", "assign_roles", "view_analytics", "access_recruitment", "manage_departments"]

        # 4. RECRUITER DASHBOARD
        elif role == 'recruiter':
            open_jobs = JobRequisition.objects.filter(status='open').count()
            candidates = Candidate.objects.count()
            interviews = InterviewRound.objects.filter(status='scheduled', scheduled_date__date=datetime.date.today()).count()
            offers = OfferLetter.objects.filter(status='sent').count()

            response_data["stats_cards"] = [
                {"title": "Open Jobs", "value": str(open_jobs), "icon": "Briefcase", "trend": "Active postings", "color": "blue"},
                {"title": "Candidates Applied", "value": str(candidates), "icon": "Users", "trend": "Talent pool", "color": "indigo"},
                {"title": "Interviews Today", "value": str(interviews), "icon": "Calendar", "trend": "Scheduled rounds", "color": "purple"},
                {"title": "Offers Released", "value": str(offers), "icon": "UserCheck", "trend": "Awaiting acceptance", "color": "emerald"}
            ]

            response_data["widgets"] = [
                {
                    "type": "recruitment_pipeline",
                    "title": "Candidates by Stage",
                    "data": [
                        {"stage": "Applied", "count": Candidate.objects.filter(status='applied').count()},
                        {"stage": "Shortlisted", "count": Candidate.objects.filter(status='shortlisted').count()},
                        {"stage": "Interviewing", "count": Candidate.objects.filter(status='interview_scheduled').count()},
                        {"stage": "Offered", "count": Candidate.objects.filter(status='offered').count()}
                    ]
                }
            ]

            response_data["sidebar_menus"] = [
                {"title": "Dashboard", "path": "/dashboard", "icon": "LayoutDashboard"},
                {"title": "Job Postings", "path": "/jobs", "icon": "Briefcase"},
                {"title": "Candidates", "path": "/candidates", "icon": "Users"},
                {"title": "Interviews", "path": "/interviews", "icon": "Calendar"},
                {"title": "Offers", "path": "/offers", "icon": "UserCheck"},
                {"title": "Reports", "path": "/reports", "icon": "BarChart"},
                {"title": "Notifications", "path": "/notifications", "icon": "Bell"}
            ]

            response_data["quick_actions"] = [
                {"title": "Post Job Requisition", "action": "create_job", "path": "/jobs/create"},
                {"title": "Schedule Interview", "action": "schedule_interview", "path": "/interviews/schedule"},
                {"title": "Draft Offer", "action": "create_offer", "path": "/offers/create"}
            ]

            response_data["permissions"] = ["manage_job_postings", "schedule_interviews", "manage_candidates", "release_offers"]

        # 5. PAYROLL DASHBOARD
        elif role == 'payroll':
            processed_runs = PayrollRun.objects.filter(status='processed').count()
            pending_payslips = Payslip.objects.filter(status='draft').count()
            
            # Aggregate salary expenses
            expenses = Payslip.objects.filter(status__in=['generated', 'approved', 'disbursed']).aggregate(total=Sum('net_salary'))['total'] or 0
            deductions = Payslip.objects.filter(status__in=['generated', 'approved', 'disbursed']).aggregate(total=Sum('total_deductions'))['total'] or 0

            response_data["stats_cards"] = [
                {"title": "Payroll Processed", "value": str(processed_runs), "icon": "DollarSign", "trend": "Completed runs", "color": "emerald"},
                {"title": "Pending Payslips", "value": str(pending_payslips), "icon": "FileText", "trend": "Awaiting actions", "color": "blue"},
                {"title": "Salary Expenses", "value": f"₹{expenses:,.0f}", "icon": "TrendingUp", "trend": "Active salaries", "color": "indigo"},
                {"title": "Deductions", "value": f"₹{deductions:,.0f}", "icon": "TrendingDown", "trend": "PF, Tax, etc.", "color": "rose"}
            ]

            response_data["widgets"] = [
                {
                    "type": "payroll_summary",
                    "title": "Payroll Processing Summaries",
                    "data": {
                        "processed": Payslip.objects.filter(status='disbursed').count(),
                        "draft": Payslip.objects.filter(status='draft').count(),
                        "generated": Payslip.objects.filter(status='generated').count()
                    }
                }
            ]

            response_data["sidebar_menus"] = [
                {"title": "Dashboard", "path": "/dashboard", "icon": "LayoutDashboard"},
                {"title": "Payroll Runs", "path": "/payroll-runs", "icon": "DollarSign"},
                {"title": "Salary Structure", "path": "/salary-structures", "icon": "Folder"},
                {"title": "Payslips", "path": "/payslips", "icon": "FileText"},
                {"title": "Deductions", "path": "/deductions", "icon": "TrendingDown"},
                {"title": "Reports", "path": "/reports", "icon": "BarChart"},
                {"title": "Settings", "path": "/settings", "icon": "Settings"}
            ]

            response_data["quick_actions"] = [
                {"title": "Run Monthly Payroll", "action": "run_payroll", "path": "/payroll-runs"},
                {"title": "Generate Payslip", "action": "generate_payslips", "path": "/payslips/generate"}
            ]

            response_data["permissions"] = ["process_payroll", "generate_payslips", "view_salary_reports", "manage_deductions"]

        # 6. ADMIN DASHBOARD
        else:
            total_users = User.objects.count()
            active_sessions = AuditLog.objects.filter(action='login', timestamp__date=datetime.date.today()).count()
            logs_count = AuditLog.objects.count()

            response_data["stats_cards"] = [
                {"title": "Total Users", "value": str(total_users), "icon": "Users", "trend": "Active accounts", "color": "blue"},
                {"title": "Active Sessions", "value": str(active_sessions), "icon": "Activity", "trend": "Today's logins", "color": "emerald"},
                {"title": "System Logs", "value": str(logs_count), "icon": "Shield", "trend": "Audit size", "color": "purple"},
                {"title": "Security Alerts", "value": "0", "icon": "AlertTriangle", "trend": "All safe", "color": "green"}
            ]

            # Upgraded Bento Grid Statistics logic
            role_counts = list(User.objects.values('role').annotate(value=Count('id')))
            dept_budgets = list(Department.objects.values('name', 'budget'))
            recent_users = [
                {"full_name": u.full_name, "email": u.email, "role": u.role, "date": u.created_at}
                for u in User.objects.all().order_by('-created_at')[:5]
            ]

            response_data["widgets"] = [
                {
                    "type": "audit_logs",
                    "title": "System Activity Log",
                    "data": [
                        {"email": log.user.email if log.user else "System", "action": log.action, "model": log.model_name, "time": log.timestamp}
                        for log in AuditLog.objects.all()[:10]
                    ]
                },
                {
                    "type": "role_distribution",
                    "title": "Dynamic Role Distribution",
                    "data": role_counts
                },
                {
                    "type": "department_budgets",
                    "title": "Department Budget Allocations",
                    "data": dept_budgets
                },
                {
                    "type": "recent_users",
                    "title": "Recently Onboarded Team Associates",
                    "data": recent_users
                }
            ]

            response_data["sidebar_menus"] = [
                {"title": "Dashboard", "path": "/dashboard", "icon": "LayoutDashboard"},
                {"title": "Users", "path": "/users", "icon": "Users"},
                {"title": "Roles & Permissions", "path": "/roles", "icon": "Shield"},
                {"title": "System Settings", "path": "/settings", "icon": "Settings"},
                {"title": "Audit Logs", "path": "/audit-logs", "icon": "FileText"},
                {"title": "Departments", "path": "/departments", "icon": "Folder"},
                {"title": "Policies", "path": "/policies", "icon": "BookOpen"},
                {"title": "Reports", "path": "/reports", "icon": "BarChart"},
                {"title": "Configurations", "path": "/configs", "icon": "Sliders"}
            ]

            response_data["quick_actions"] = [
                {"title": "Register User", "action": "create_user", "path": "/users/create"},
                {"title": "Assign Permissions", "action": "assign_roles", "path": "/roles/assign"},
                {"title": "View Security Logs", "action": "view_security_logs", "path": "/audit-logs"}
            ]

            response_data["permissions"] = ["full_system_access", "manage_users", "assign_roles", "configure_system", "access_audit_logs", "security_management"]

        return Response(response_data)


# ==========================================
# EMPLOYEE DASHBOARD BACKEND APIS
# ==========================================

class EmployeeDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Exposes the central dashboard mapped for Employee
        return DashboardViewSet().dashboard(request)


class EmployeeProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = EmployeeProfile.objects.get(user=request.user)
        return Response(EmployeeProfileSerializer(profile).data)


class LeaveApplyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from core.utils import get_financial_year
        leave_type_id = request.data.get('leave_type')
        start_date_str = request.data.get('start_date')
        end_date_str = request.data.get('end_date')
        reason = request.data.get('reason')

        if not leave_type_id or not start_date_str or not end_date_str or not reason:
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

        start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.datetime.strptime(end_date_str, '%Y-%m-%d').date()

        num_days = (end_date - start_date).days + 1
        leave_type = LeaveType.objects.get(id=leave_type_id)

        balance, _ = LeaveBalance.objects.get_or_create(
            employee=request.user,
            leave_type=leave_type,
            financial_year=get_financial_year(),
            defaults={'total_days': leave_type.max_days_per_year}
        )

        if num_days > balance.available_days:
            return Response({'error': f'Insufficient leave balance. Requested {num_days}, available {balance.available_days}'}, status=status.HTTP_400_BAD_REQUEST)

        app = LeaveApplication.objects.create(
            employee=request.user,
            leave_type=leave_type,
            start_date=start_date,
            end_date=end_date,
            reason=reason,
            status='pending'
        )

        balance.pending_days += num_days
        balance.save()

        return Response(LeaveApplicationSerializer(app).data, status=status.HTTP_201_CREATED)


class AttendanceMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        records = AttendanceRecord.objects.filter(employee=request.user)
        return Response(AttendanceRecordSerializer(records, many=True).data)


class PayslipsMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        payslips = Payslip.objects.filter(employee=request.user)
        return Response(PayslipSerializer(payslips, many=True).data)


class NotificationsMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notifs = Notification.objects.filter(recipient=request.user)
        return Response(NotificationSerializer(notifs, many=True).data)


# ==========================================
# MANAGER DASHBOARD BACKEND APIS
# ==========================================

class ManagerDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['manager', 'hr', 'admin']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        return DashboardViewSet().dashboard(request)


class ManagerTeamView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        members = EmployeeProfile.objects.filter(reporting_manager=request.user)
        return Response(EmployeeProfileSerializer(members, many=True).data)


class ManagerLeaveRequestsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role in ['hr', 'admin']:
            requests = LeaveApplication.objects.filter(status='pending')
        else:
            from django.db.models import Q
            requests = LeaveApplication.objects.filter(
                Q(status='pending'),
                Q(employee__employee_profile__reporting_manager=user) |
                Q(employee__employee_profile__reporting_manager__isnull=True)
            ).exclude(employee=user)
        return Response(LeaveApplicationSerializer(requests, many=True).data)


class ManagerApproveLeaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        app_id = request.data.get('leave_application_id')
        new_status = request.data.get('status')
        remarks = request.data.get('approval_remarks', '')

        if not app_id or new_status not in ['approved', 'rejected']:
            return Response({'error': 'Invalid payload'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if request.user.role in ['hr', 'admin']:
                app = LeaveApplication.objects.get(id=app_id)
            else:
                from django.db.models import Q
                app = LeaveApplication.objects.get(
                    Q(id=app_id),
                    Q(employee__employee_profile__reporting_manager=request.user) |
                    Q(employee__employee_profile__reporting_manager__isnull=True)
                )
                if app.employee == request.user:
                    return Response({'error': 'You cannot approve your own leave application'}, status=status.HTTP_403_FORBIDDEN)
        except LeaveApplication.DoesNotExist:
            return Response({'error': 'Leave application not found'}, status=status.HTTP_404_NOT_FOUND)

        app.status = new_status
        app.approved_by = request.user
        app.approval_remarks = remarks
        app.approval_date = timezone.now()
        app.save()

        # Update leave balance
        from core.utils import get_financial_year
        num_days = app.number_of_days
        balance, _ = LeaveBalance.objects.get_or_create(
            employee=app.employee,
            leave_type=app.leave_type,
            financial_year=get_financial_year(),
            defaults={'total_days': app.leave_type.max_days_per_year}
        )

        # Clear pending
        balance.pending_days = max(0, balance.pending_days - num_days)
        if new_status == 'approved':
            balance.used_days += num_days
            
            # Setup attendance records
            curr = app.start_date
            delta = datetime.timedelta(days=1)
            while curr <= app.end_date:
                AttendanceRecord.objects.update_or_create(
                    employee=app.employee,
                    date=curr,
                    defaults={'status': 'leave', 'remarks': 'On Approved Leave'}
                )
                curr += delta
        balance.save()

        return Response(LeaveApplicationSerializer(app).data)


class ManagerPerformanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        appraisals = EmployeeAppraisal.objects.filter(manager=request.user)
        from appraisal.serializers import EmployeeAppraisalSerializer
        return Response(EmployeeAppraisalSerializer(appraisals, many=True).data)


class ManagerTeamAttendanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        records = AttendanceRecord.objects.filter(employee__employee_profile__reporting_manager=request.user)
        return Response(AttendanceRecordSerializer(records, many=True).data)


# ==========================================
# HR DASHBOARD BACKEND APIS
# ==========================================

class HRDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['hr', 'admin']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        return DashboardViewSet().dashboard(request)


class HRAllEmployeesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profiles = EmployeeProfile.objects.all()
        return Response(EmployeeProfileSerializer(profiles, many=True).data)


class HREmployeeCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    # ---------------------------------------------------------------
    # Role-creation permission matrix:
    #   HR      → can create: employee, manager, recruiter
    #             cannot create: hr, payroll, admin
    #   Admin   → can create: employee, manager, recruiter, hr, payroll
    #             cannot create: admin (super-admin privilege)
    # ---------------------------------------------------------------
    HR_ALLOWED_ROLES    = {'employee', 'manager', 'recruiter'}
    ADMIN_ALLOWED_ROLES = {'employee', 'manager', 'recruiter', 'hr', 'payroll'}

    def post(self, request):
        requesting_user = request.user
        requesting_role = (requesting_user.role or '').lower()

        email = request.data.get('email')
        password = request.data.get('password')
        full_name = request.data.get('full_name')
        role = (request.data.get('role') or 'employee').lower()
        dept_name = request.data.get('department')
        desig_name = request.data.get('designation')

        if not email or not password or not full_name:
            return Response({'error': 'Missing core fields'}, status=status.HTTP_400_BAD_REQUEST)

        # ── Enforce role-creation matrix ──────────────────────────────
        if requesting_role == 'hr':
            if role not in self.HR_ALLOWED_ROLES:
                return Response(
                    {'error': f'HR is not authorised to create a user with role "{role}". '  
                               f'Allowed roles: {sorted(self.HR_ALLOWED_ROLES)}.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif requesting_role == 'admin':
            if role not in self.ADMIN_ALLOWED_ROLES:
                return Response(
                    {'error': f'Admin cannot create an "admin" account. '  
                               f'Only a Super Admin can create Admin users.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            # Non-HR/Admin users cannot create accounts via this endpoint
            return Response(
                {'error': 'You do not have permission to create user accounts.'},
                status=status.HTTP_403_FORBIDDEN
            )
        # ─────────────────────────────────────────────────────────────

        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate a unique username by handling potential collisions robustly
        base_username = email.split('@')[0]
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            full_name=full_name,
            role=role,
            department=dept_name,
            designation=desig_name
        )

        profile = EmployeeProfile.objects.get(user=user)
        if dept_name:
            dept, _ = Department.objects.get_or_create(name=dept_name)
            profile.department = dept
        if desig_name and profile.department:
            desig, _ = Designation.objects.get_or_create(name=desig_name, department=profile.department)
            profile.designation = desig
        profile.save()

        return Response(EmployeeProfileSerializer(profile).data, status=status.HTTP_201_CREATED)


class HREmployeeUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        try:
            profile = EmployeeProfile.objects.get(id=pk)
        except EmployeeProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = EmployeeProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HRDepartmentsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        depts = Department.objects.all()
        return Response(DepartmentSerializer(depts, many=True).data)


class HRAnalyticsSnapshotView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from analytics.views import AnalyticsSnapshotViewSet
        return AnalyticsSnapshotViewSet().latest(request)


class HRRecruitmentOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = {
            'requisitions': JobRequisition.objects.count(),
            'candidates': Candidate.objects.count(),
            'offers': OfferLetter.objects.count()
        }
        return Response(data)


# ==========================================
# RECRUITER DASHBOARD BACKEND APIS
# ==========================================

class RecruiterDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return DashboardViewSet().dashboard(request)


class RecruiterJobCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = JobRequisitionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RecruiterCandidatesListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        candidates = Candidate.objects.all()
        return Response(CandidateSerializer(candidates, many=True).data)


class RecruiterScheduleInterviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = InterviewRoundSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RecruiterOfferCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = OfferLetterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RecruiterAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        pipeline = [
            {"stage": "Applied", "count": Candidate.objects.filter(status='applied').count()},
            {"stage": "Interviewing", "count": Candidate.objects.filter(status='interview_scheduled').count()},
            {"stage": "Offered", "count": Candidate.objects.filter(status='offered').count()}
        ]
        return Response({"pipeline": pipeline})


# ==========================================
# PAYROLL DASHBOARD BACKEND APIS
# ==========================================

class PayrollDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return DashboardViewSet().dashboard(request)


class PayrollProcessView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from payroll.views import PayrollRunViewSet
        month_year = request.data.get('month_year')
        if not month_year:
            return Response({'error': 'month_year is required'}, status=status.HTTP_400_BAD_REQUEST)

        payroll_run, created = PayrollRun.objects.get_or_create(
            month_year=month_year,
            defaults={'status': 'draft', 'total_employees': 0}
        )
        
        # Trigger actual logic
        pr_view = PayrollRunViewSet()
        pr_view._process_payroll(payroll_run)
        payroll_run.status = 'processed'
        payroll_run.save()

        return Response(PayrollRunSerializer(payroll_run).data)


class PayrollSalaryStructuresView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        structures = SalaryStructure.objects.all()
        return Response(SalaryStructureSerializer(structures, many=True).data)


class PayrollPayslipsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        payslips = Payslip.objects.all()
        return Response(PayslipSerializer(payslips, many=True).data)


class PayrollGeneratePayslipsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        month_year = request.data.get('month_year')
        if not month_year:
            return Response({'error': 'month_year is required'}, status=status.HTTP_400_BAD_REQUEST)
        return PayrollProcessView().post(request)


class PayrollReportsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = {
            'total_salary_expense': Payslip.objects.aggregate(total=Sum('net_salary'))['total'] or 0,
            'total_deductions': Payslip.objects.aggregate(total=Sum('total_deductions'))['total'] or 0
        }
        return Response(data)


# ==========================================
# ADMIN DASHBOARD BACKEND APIS
# ==========================================

class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return DashboardViewSet().dashboard(request)


class AdminUsersListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        users = User.objects.all()
        return Response(UserSerializer(users, many=True).data)


class AdminUserCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return HREmployeeCreateView().post(request)


class AdminAssignRoleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    # Role-assignment matrix (same rules as create)
    HR_ALLOWED_ROLES    = {'employee', 'manager', 'recruiter'}
    ADMIN_ALLOWED_ROLES = {'employee', 'manager', 'recruiter', 'hr', 'payroll'}

    def _assign_role(self, request):
        requesting_role = (request.user.role or '').lower()

        user_id = request.data.get('user_id')
        new_role = (request.data.get('role') or '').lower() or None
        dept_id = request.data.get('department_id') or request.data.get('department')
        desig_id = request.data.get('designation_id') or request.data.get('designation')
        manager_id = request.data.get('reporting_manager_id') or request.data.get('reporting_manager')
        office_location = request.data.get('office_location')
        is_active = request.data.get('is_active')

        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        # ── Enforce role-assignment matrix ────────────────────────────
        if new_role:
            if requesting_role == 'hr':
                if new_role not in self.HR_ALLOWED_ROLES:
                    return Response(
                        {'error': f'HR cannot assign the role "{new_role}". '
                                  f'Allowed roles: {sorted(self.HR_ALLOWED_ROLES)}.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            elif requesting_role == 'admin':
                if new_role not in self.ADMIN_ALLOWED_ROLES:
                    return Response(
                        {'error': 'Admin cannot assign the "admin" role. '
                                  'Only a Super Admin can grant Admin privileges.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                return Response(
                    {'error': 'You do not have permission to assign roles.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        # ─────────────────────────────────────────────────────────────

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if new_role is not None:
            user.role = new_role
            
        if is_active is not None:
            user.is_active = bool(is_active)
            
        # Get or create EmployeeProfile
        profile, _ = EmployeeProfile.objects.get_or_create(user=user)

        from employees.models import Department, Designation
        
        # Handle department assignment
        if dept_id:
            try:
                if isinstance(dept_id, int) or (isinstance(dept_id, str) and dept_id.isdigit()):
                    dept_obj = Department.objects.get(id=int(dept_id))
                else:
                    dept_obj = Department.objects.get(name=dept_id)
                profile.department = dept_obj
                user.department = dept_obj.name
            except Department.DoesNotExist:
                return Response({'error': f'Department not found'}, status=status.HTTP_400_BAD_REQUEST)
        elif dept_id == "":
            profile.department = None
            user.department = None

        # Handle designation assignment
        if desig_id:
            try:
                if isinstance(desig_id, int) or (isinstance(desig_id, str) and desig_id.isdigit()):
                    desig_obj = Designation.objects.get(id=int(desig_id))
                else:
                    desig_obj = Designation.objects.get(name=desig_id)
                profile.designation = desig_obj
                user.designation = desig_obj.name
            except Designation.DoesNotExist:
                return Response({'error': f'Designation not found'}, status=status.HTTP_400_BAD_REQUEST)
        elif desig_id == "":
            profile.designation = None
            user.designation = None

        # Handle manager assignment
        if manager_id:
            try:
                manager_user = User.objects.get(id=int(manager_id))
                profile.reporting_manager = manager_user
            except (User.DoesNotExist, ValueError):
                return Response({'error': f'Manager not found'}, status=status.HTTP_400_BAD_REQUEST)
        elif manager_id == "":
            profile.reporting_manager = None

        if office_location is not None:
            profile.office_location = office_location

        user.save()
        profile.save()

        # Log audit
        from accounts.models import AuditLog
        AuditLog.objects.create(
            user=request.user,
            action='update',
            model_name='User',
            object_id=user.id,
            changes={
                'action': 'onboard_assignment',
                'role': user.role,
                'department': user.department,
                'designation': user.designation,
                'is_active': user.is_active
            }
        )

        return Response(UserSerializer(user).data)

    def put(self, request):
        return self._assign_role(request)

    def post(self, request):
        return self._assign_role(request)


class AdminAuditLogsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        logs = AuditLog.objects.all()
        return Response(AuditLogSerializer(logs, many=True).data)


class AdminSystemAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = {
            'cpu_load': '12%',
            'ram_usage': '42%',
            'active_sessions': AuditLog.objects.filter(action='login').count()
        }
        return Response(data)


class AdminSecurityLogsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        logs = AuditLog.objects.filter(action__in=['login', 'logout'])
        return Response(AuditLogSerializer(logs, many=True).data)


class DashboardCardViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DashboardCardSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return DashboardCard.objects.filter(
            applicable_role=user.role,
            is_active=True
        ).order_by('position')


# ==========================================
# ENTERPRISE ROLES & PERMISSIONS GOVERNANCE
# ==========================================

class RoleGovernanceView(APIView):
    """
    Returns real role-based governance data for the Admin Roles & Permissions module.
    Each role entry includes user counts, user details (with last login from AuditLog),
    and access tier metadata. Admin-only endpoint.
    """
    permission_classes = [permissions.IsAuthenticated]

    ROLE_METADATA = {
        'admin': {
            'title': 'System Administrator',
            'tier': 'Tier-1 · Critical Security Access',
            'classification': 'CRITICAL',
            'description': 'Full platform governance with unrestricted access to all system configurations, security controls, and organizational data.',
            'responsibilities': [
                'Full platform access & governance',
                'User account lifecycle management',
                'Security protocol configuration',
                'Audit log monitoring & analysis',
                'System-wide settings control',
                'Role & privilege assignment',
            ],
            'capabilities': [
                'Create/modify/delete any user account',
                'Access all modules without restriction',
                'Configure system-level settings',
                'View complete audit trail',
                'Manage security certificates',
                'Override any access control',
            ],
        },
        'hr': {
            'title': 'HR Manager',
            'tier': 'Tier-2 · HR Operational Access',
            'classification': 'RESTRICTED',
            'description': 'End-to-end employee lifecycle management including onboarding, department assignments, leave governance, and workforce analytics.',
            'responsibilities': [
                'Employee onboarding & offboarding',
                'Department & designation management',
                'Leave policy configuration',
                'Workforce analytics & reporting',
                'Attendance oversight',
                'Recruitment pipeline supervision',
            ],
            'capabilities': [
                'Create Employee / Manager / Recruiter accounts',
                'Assign and transfer departments',
                'Approve special leave requests',
                'View all employee records',
                'Generate workforce reports',
                'Access recruitment data',
            ],
        },
        'manager': {
            'title': 'Department Manager',
            'tier': 'Tier-2 · Team Lead Access',
            'classification': 'INTERNAL',
            'description': 'Operational team supervision with authority over attendance, leave approvals, performance reviews, and direct report management.',
            'responsibilities': [
                'Direct team supervision',
                'Leave request approvals',
                'Attendance monitoring',
                'Performance review submissions',
                'Goal sheet evaluations',
                'Appraisal rating approvals',
            ],
            'capabilities': [
                'View team employee profiles',
                'Approve or reject leave requests',
                'Monitor team attendance records',
                'Submit appraisal reviews',
                'Recommend promotions',
                'Access team productivity reports',
            ],
        },
        'recruiter': {
            'title': 'Recruiter',
            'tier': 'Tier-3 · Talent Acquisition Access',
            'classification': 'INTERNAL',
            'description': 'End-to-end candidate pipeline management covering job requisitions, sourcing, interview scheduling, and offer letter generation.',
            'responsibilities': [
                'Job requisition management',
                'Candidate sourcing & tracking',
                'Interview round scheduling',
                'Offer letter generation',
                'Hiring pipeline reporting',
            ],
            'capabilities': [
                'Create and manage job postings',
                'View and update candidate records',
                'Schedule interview rounds',
                'Generate offer letters',
                'Access recruitment analytics',
            ],
        },
        'payroll': {
            'title': 'Payroll Executive',
            'tier': 'Tier-3 · Compensation Gatekeeper',
            'classification': 'CONFIDENTIAL',
            'description': 'Salary computation, payslip generation, deduction management, and payroll compliance in line with financial regulatory requirements.',
            'responsibilities': [
                'Monthly payroll processing',
                'Payslip generation & distribution',
                'Deduction rules management',
                'Salary structure configuration',
                'Tax computation oversight',
                'Payroll compliance reporting',
            ],
            'capabilities': [
                'Process and approve payroll runs',
                'Generate employee payslips',
                'Configure salary structures',
                'Manage deductions & bonuses',
                'View compensation reports',
                'Access employee salary data',
            ],
        },
        'employee': {
            'title': 'Employee',
            'tier': 'Tier-4 · Self-Service Access',
            'classification': 'PUBLIC',
            'description': 'Standard corporate self-service access for personal profile management, attendance tracking, leave applications, and payslip downloads.',
            'responsibilities': [
                'Personal profile maintenance',
                'Daily attendance check-in/out',
                'Leave application submission',
                'Goal sheet self-assessment',
                'Payslip download access',
                'Appraisal self-review',
            ],
            'capabilities': [
                'View and update own profile',
                'Submit leave requests',
                'Clock in/out for attendance',
                'Download own payslips',
                'Access own appraisal data',
                'View own notifications',
            ],
        },
    }

    def get(self, request):
        # Only Admin can access this governance endpoint
        if request.user.role != 'admin':
            return Response(
                {'error': 'Access restricted to System Administrators.'},
                status=status.HTTP_403_FORBIDDEN
            )

        role_filter = request.query_params.get('role')

        governance_data = []
        roles_to_show = [role_filter] if role_filter and role_filter in self.ROLE_METADATA else list(self.ROLE_METADATA.keys())

        for role_key in roles_to_show:
            meta = self.ROLE_METADATA[role_key]
            users = User.objects.filter(role=role_key).select_related('employee_profile')

            user_list = []
            for u in users:
                # Fetch last login from AuditLog (most recent 'login' entry)
                last_login_log = AuditLog.objects.filter(
                    user=u, action='login'
                ).order_by('-timestamp').first()

                # Get employee profile data
                try:
                    profile = u.employee_profile
                    dept_name = profile.department.name if profile.department else (u.department or '—')
                    desig_name = profile.designation.name if profile.designation else (u.designation or '—')
                    emp_status = profile.status or 'active'
                    reporting_manager_name = profile.reporting_manager.full_name if profile.reporting_manager else '—'
                except Exception:
                    dept_name = u.department or '—'
                    desig_name = u.designation or '—'
                    emp_status = 'active'
                    reporting_manager_name = '—'

                user_list.append({
                    'id': u.id,
                    'employee_id': u.employee_id or f'EMP{u.id:04d}',
                    'full_name': u.full_name or u.email.split('@')[0],
                    'email': u.email,
                    'department': dept_name,
                    'designation': desig_name,
                    'role': u.role,
                    'is_active': u.is_active,
                    'employment_status': emp_status,
                    'reporting_manager': reporting_manager_name,
                    'last_login': last_login_log.timestamp.isoformat() if last_login_log else None,
                    'joined_date': u.joining_date.isoformat() if u.joining_date else None,
                    'profile_image': u.profile_image.url if u.profile_image else None,
                })

            governance_data.append({
                'role_key': role_key,
                'title': meta['title'],
                'tier': meta['tier'],
                'classification': meta['classification'],
                'description': meta['description'],
                'responsibilities': meta['responsibilities'],
                'capabilities': meta['capabilities'],
                'user_count': len(user_list),
                'active_count': sum(1 for u in user_list if u['is_active']),
                'users': user_list,
            })

        return Response(governance_data)


class RoleUserActionView(APIView):
    """
    Admin-only endpoint to perform governance actions on specific users:
    - toggle_active: Activate or deactivate account
    - change_role: Change assigned role (respects role matrix)
    - transfer_dept: Transfer to another department
    - reset_password: Reset to a temporary password
    """
    permission_classes = [permissions.IsAuthenticated]

    ADMIN_ALLOWED_ROLES = {'employee', 'manager', 'recruiter', 'hr', 'payroll'}

    def post(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        action_type = request.data.get('action')
        target_user_id = request.data.get('user_id')

        if not target_user_id or not action_type:
            return Response({'error': 'action and user_id are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = User.objects.get(id=target_user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        changes = {'action': action_type}

        if action_type == 'toggle_active':
            target_user.is_active = not target_user.is_active
            target_user.save()
            changes['is_active'] = target_user.is_active
            msg = f'Account {"activated" if target_user.is_active else "deactivated"} successfully.'

        elif action_type == 'change_role':
            new_role = (request.data.get('role') or '').lower()
            if not new_role:
                return Response({'error': 'role is required for change_role action.'}, status=status.HTTP_400_BAD_REQUEST)
            if new_role not in self.ADMIN_ALLOWED_ROLES:
                return Response({'error': f'Cannot assign role "{new_role}". Allowed: {sorted(self.ADMIN_ALLOWED_ROLES)}'}, status=status.HTTP_403_FORBIDDEN)
            changes['old_role'] = target_user.role
            target_user.role = new_role
            target_user.save()
            changes['new_role'] = new_role
            msg = f'Role changed to "{new_role}" successfully.'

        elif action_type == 'transfer_dept':
            dept_name = request.data.get('department')
            if not dept_name:
                return Response({'error': 'department is required.'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                dept = Department.objects.get(name=dept_name)
                profile, _ = EmployeeProfile.objects.get_or_create(user=target_user)
                profile.department = dept
                profile.save()
                target_user.department = dept.name
                target_user.save()
                changes['department'] = dept_name
                msg = f'User transferred to department "{dept_name}".'
            except Department.DoesNotExist:
                return Response({'error': f'Department "{dept_name}" not found.'}, status=status.HTTP_404_NOT_FOUND)

        elif action_type == 'reset_password':
            temp_password = request.data.get('new_password', 'TempPass@2026!')
            target_user.set_password(temp_password)
            target_user.save()
            changes['password_reset'] = True
            msg = 'Password has been reset successfully.'

        else:
            return Response({'error': f'Unknown action: {action_type}'}, status=status.HTTP_400_BAD_REQUEST)

        # Audit log
        AuditLog.objects.create(
            user=request.user,
            action='update',
            model_name='User',
            object_id=target_user.id,
            changes=changes
        )

        return Response({'message': msg, 'user_id': target_user.id, 'action': action_type})


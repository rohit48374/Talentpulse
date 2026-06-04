package com.talentpulse.hrms.controller;

import com.talentpulse.hrms.model.*;
import com.talentpulse.hrms.repository.*;
import com.talentpulse.hrms.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class DashboardController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeProfileRepository employeeProfileRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private DesignationRepository designationRepository;

    @Autowired
    private LeaveTypeRepository leaveTypeRepository;

    @Autowired
    private LeaveBalanceRepository leaveBalanceRepository;

    @Autowired
    private LeaveApplicationRepository leaveApplicationRepository;

    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;

    @Autowired
    private PayslipRepository payslipRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private JobRequisitionRepository jobRequisitionRepository;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private InterviewRoundRepository interviewRoundRepository;

    @Autowired
    private OfferLetterRepository offerLetterRepository;

    @Autowired
    private PayrollRunRepository payrollRunRepository;

    @Autowired
    private SalaryStructureRepository salaryStructureRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private DashboardCardRepository dashboardCardRepository;

    @Autowired
    private EmployeeAppraisalRepository employeeAppraisalRepository;

    @Autowired
    private GradeStructureRepository gradeStructureRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // --- CENTRAL DASHBOARD ENGINE ---

    @GetMapping("/dashboard/")
    public ResponseEntity<?> getCentralDashboard(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userOpt.get();
        String role = user.getRole() != null ? user.getRole().toLowerCase() : "employee";
        if ("hrbp".equals(role) || "hr_admin".equals(role)) {
            role = "hr";
        } else if ("super_admin".equals(role)) {
            role = "admin";
        }

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("role", role);
        responseData.put("stats_cards", new ArrayList<>());
        responseData.put("widgets", new ArrayList<>());
        responseData.put("sidebar_menus", new ArrayList<>());
        responseData.put("quick_actions", new ArrayList<>());
        responseData.put("notifications", new ArrayList<>());
        responseData.put("permissions", new ArrayList<>());

        // Notifications
        List<Notification> unreadNotifs = notificationRepository.findByRecipientIdAndStatus(user.getId(), "unread");
        List<Map<String, Object>> notifsMap = unreadNotifs.stream().limit(5).map(n -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", n.getId());
            m.put("title", n.getTitle());
            m.put("message", n.getMessage());
            m.put("status", n.getStatus());
            m.put("created_at", n.getCreatedAt() != null ? n.getCreatedAt().toString() : null);
            return m;
        }).collect(Collectors.toList());
        responseData.put("notifications", notifsMap);

        LocalDate today = LocalDate.now();

        // 1. EMPLOYEE DASHBOARD
        if ("employee".equals(role)) {
            // Stats Cards
            LocalDate monthStart = today.withDayOfMonth(1);
            long presentDays = attendanceRecordRepository.countByEmployeeIdAndStatusAndDateBetween(user.getId(), "present", monthStart, today);

            long remainingLeaves = 0;
            List<LeaveBalance> balances = leaveBalanceRepository.findByEmployeeId(user.getId());
            for (LeaveBalance b : balances) {
                remainingLeaves += b.getAvailableDays();
            }

            long pendingRequests = leaveApplicationRepository.countByEmployeeIdAndStatus(user.getId(), "pending");
            Optional<Payslip> latestPayslipOpt = payslipRepository.findTopByEmployeeIdAndStatusOrderByIdDesc(user.getId(), "disbursed");
            String payslipStr = latestPayslipOpt.map(payslip -> "₹" + payslip.getNetSalary()).orElse("No payslip yet");
            String trendPayslip = latestPayslipOpt.map(payslip -> payslip.getPayrollRun() != null ? payslip.getPayrollRun().getMonthYear() : "N/A").orElse("N/A");

            List<Map<String, Object>> statsCards = new ArrayList<>();
            statsCards.add(createCard("Present Days", String.valueOf(presentDays), "CheckSquare", "This month", "emerald"));
            statsCards.add(createCard("Remaining Leaves", String.valueOf(remainingLeaves), "Calendar", "FY 2026-2027", "blue"));
            statsCards.add(createCard("Pending Requests", String.valueOf(pendingRequests), "Clock", "Awaiting approval", "amber"));
            statsCards.add(createCard("Latest Payslip", payslipStr, "FileText", trendPayslip, "purple"));
            responseData.put("stats_cards", statsCards);

            // Widgets
            List<Map<String, Object>> widgets = new ArrayList<>();
            Map<String, Object> widget1 = new HashMap<>();
            widget1.put("type", "attendance_summary");
            widget1.put("title", "Attendance Summary");
            Map<String, Object> attSummary = new HashMap<>();
            attSummary.put("present", presentDays);
            attSummary.put("absent", attendanceRecordRepository.countByEmployeeIdAndStatusAndDateBetween(user.getId(), "absent", monthStart, today));
            attSummary.put("leave", attendanceRecordRepository.countByEmployeeIdAndStatusAndDateBetween(user.getId(), "leave", monthStart, today));
            widget1.put("data", attSummary);
            widgets.add(widget1);

            Map<String, Object> widget2 = new HashMap<>();
            widget2.put("type", "leave_balance");
            widget2.put("title", "Leave Balance Chart");
            List<Map<String, Object>> lbList = balances.stream().map(b -> {
                Map<String, Object> m = new HashMap<>();
                m.put("type", b.getLeaveType().getName());
                m.put("total", b.getTotalDays());
                m.put("used", b.getUsedDays());
                m.put("available", b.getAvailableDays());
                return m;
            }).collect(Collectors.toList());
            widget2.put("data", lbList);
            widgets.add(widget2);

            Map<String, Object> widget3 = new HashMap<>();
            widget3.put("type", "upcoming_holidays");
            widget3.put("title", "Upcoming Holidays");
            List<Map<String, Object>> holidays = new ArrayList<>();
            holidays.add(createHoliday("Independence Day", "2026-08-15"));
            holidays.add(createHoliday("Diwali", "2026-11-08"));
            widget3.put("data", holidays);
            widgets.add(widget3);
            responseData.put("widgets", widgets);

            // Menus, Quick Actions, Permissions
            responseData.put("sidebar_menus", Arrays.asList(
                createMenu("Dashboard", "/dashboard", "LayoutDashboard"),
                createMenu("My Profile", "/profile", "User"),
                createMenu("Attendance", "/attendance", "Clock"),
                createMenu("Leave Management", "/leaves", "Calendar"),
                createMenu("Payslips", "/payslips", "FileText"),
                createMenu("Appraisal", "/appraisal", "TrendingUp"),
                createMenu("Notifications", "/notifications", "Bell"),
                createMenu("Settings", "/settings", "Settings")
            ));

            responseData.put("quick_actions", Arrays.asList(
                createAction("Apply Leave", "apply_leave", "/leaves/apply"),
                createAction("Check In / Out", "check_in_out", "/attendance"),
                createAction("Download Payslip", "download_latest_payslip", "/payslips")
            ));

            responseData.put("permissions", Arrays.asList("view_own_profile", "apply_leave", "view_attendance", "download_own_payslip", "view_own_appraisal"));
        }

        // 2. MANAGER DASHBOARD
        else if ("manager".equals(role)) {
            List<EmployeeProfile> teamProfiles = employeeProfileRepository.findByReportingManagerId(user.getId());
            long teamCount = teamProfiles.size();
            long pendingLeaves = leaveApplicationRepository.findByReportingManagerIdAndStatus(user.getId(), "pending").size();
            long teamAttendanceToday = attendanceRecordRepository.countPresentTeamMembersByDate(user.getId(), today);
            String attRate = teamCount > 0 ? String.format("%.1f%%", ((double) teamAttendanceToday / teamCount) * 100) : "100%";
            long pendingReviews = employeeAppraisalRepository.countByManagerIdAndStatus(user.getId(), "manager_review");

            List<Map<String, Object>> statsCards = new ArrayList<>();
            statsCards.add(createCard("Team Strength", String.valueOf(teamCount), "Users", "Active members", "blue"));
            statsCards.add(createCard("Pending Leave Requests", String.valueOf(pendingLeaves), "Clock", "Action required", "amber"));
            statsCards.add(createCard("Attendance Rate", attRate, "CheckSquare", "Today's rate", "emerald"));
            statsCards.add(createCard("Pending Reviews", String.valueOf(pendingReviews), "TrendingUp", "Appraisal reviews", "rose"));
            responseData.put("stats_cards", statsCards);

            // Last 5 weekdays
            List<LocalDate> workdays = new ArrayList<>();
            LocalDate curr = today;
            while (workdays.size() < 5) {
                int dayOfWeek = curr.getDayOfWeek().getValue();
                if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                    workdays.add(curr);
                }
                curr = curr.minusDays(1);
            }
            Collections.reverse(workdays);

            List<Map<String, Object>> teamAttData = new ArrayList<>();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEE");
            for (LocalDate day : workdays) {
                String dayName = day.format(formatter);
                long presentCount = attendanceRecordRepository.countPresentTeamMembersByDate(user.getId(), day);
                Map<String, Object> m = new HashMap<>();
                m.put("day", dayName);
                m.put("present", presentCount);
                teamAttData.add(m);
            }

            List<Map<String, Object>> widgets = new ArrayList<>();
            Map<String, Object> widget1 = new HashMap<>();
            widget1.put("type", "team_attendance");
            widget1.put("title", "Team Attendance (Last 5 Days)");
            widget1.put("data", teamAttData);
            widgets.add(widget1);

            Map<String, Object> widget2 = new HashMap<>();
            widget2.put("type", "employees_on_leave");
            widget2.put("title", "Employees on Leave Today");
            List<LeaveApplication> activeLeaves = leaveApplicationRepository.findActiveLeavesByReportingManagerId(user.getId(), today);
            List<Map<String, Object>> leaveList = activeLeaves.stream().map(lv -> {
                Map<String, Object> m = new HashMap<>();
                m.put("name", lv.getEmployee().getFullName());
                m.put("type", lv.getLeaveType().getName());
                m.put("days", lv.getNumberOfDays());
                return m;
            }).collect(Collectors.toList());
            widget2.put("data", leaveList);
            widgets.add(widget2);

            Map<String, Object> widget3 = new HashMap<>();
            widget3.put("type", "team_members_list");
            widget3.put("title", "My Team Members");
            List<Map<String, Object>> memberList = teamProfiles.stream().map(member -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", member.getUser().getId());
                m.put("full_name", member.getUser().getFullName());
                m.put("email", member.getUser().getEmail());
                m.put("phone", member.getUser().getPhone());
                m.put("designation", member.getDesignation() != null ? member.getDesignation().getName() : "Team Associate");
                m.put("department", member.getDepartment() != null ? member.getDepartment().getName() : "General");
                m.put("profile_image", member.getUser().getProfileImage());
                m.put("status", member.getStatus());
                return m;
            }).collect(Collectors.toList());
            widget3.put("data", memberList);
            widgets.add(widget3);
            responseData.put("widgets", widgets);

            responseData.put("sidebar_menus", Arrays.asList(
                createMenu("Dashboard", "/dashboard", "LayoutDashboard"),
                createMenu("Team Attendance", "/team-attendance", "Clock"),
                createMenu("Leave Approvals", "/leave-approvals", "CheckSquare"),
                createMenu("Performance Reviews", "/team-performance", "TrendingUp"),
                createMenu("Employees", "/team-employees", "Users"),
                createMenu("Reports", "/team-reports", "BarChart"),
                createMenu("Notifications", "/notifications", "Bell")
            ));

            responseData.put("quick_actions", Arrays.asList(
                createAction("Approve Leaves", "approve_leaves", "/leave-approvals"),
                createAction("Review Performance", "review_appraisals", "/team-performance")
            ));

            responseData.put("permissions", Arrays.asList("approve_leave", "reject_leave", "view_team_attendance", "review_appraisal", "view_team_profiles"));
        }

        // 3. HR DASHBOARD
        else if ("hr".equals(role)) {
            long totalEmployees = userRepository.count(); // Count of all accounts
            long activeRecruitments = jobRequisitionRepository.countByStatus("open");
            // Simple mock attrition rate based on exited status
            long exitedEmp = userRepository.findByStatus("exited").size();
            String attrition = totalEmployees > 0 ? String.format("%.1f%%", ((double) exitedEmp / totalEmployees) * 100) : "0.0%";
            long deptCount = departmentRepository.count();

            List<Map<String, Object>> statsCards = new ArrayList<>();
            statsCards.add(createCard("Total Employees", String.valueOf(totalEmployees), "Users", "Active headcount", "indigo"));
            statsCards.add(createCard("Active Recruitments", String.valueOf(activeRecruitments), "Briefcase", "Open openings", "amber"));
            statsCards.add(createCard("Attrition Rate", attrition, "TrendingDown", "Annual YTD", "emerald"));
            statsCards.add(createCard("Departments", String.valueOf(deptCount), "Folder", "Configured", "purple"));
            responseData.put("stats_cards", statsCards);

            // Widgets
            List<Map<String, Object>> widgets = new ArrayList<>();
            Map<String, Object> widget1 = new HashMap<>();
            widget1.put("type", "department_statistics");
            widget1.put("title", "Department Headcount");
            List<Map<String, Object>> deptStats = departmentRepository.findAll().stream().map(dept -> {
                Map<String, Object> m = new HashMap<>();
                m.put("name", dept.getName());
                m.put("value", employeeProfileRepository.findByDepartmentId(dept.getId()).size());
                return m;
            }).collect(Collectors.toList());
            widget1.put("data", deptStats);
            widgets.add(widget1);

            Map<String, Object> widget2 = new HashMap<>();
            widget2.put("type", "new_joiners");
            widget2.put("title", "New Joiners This Month");
            // Fetch users joined in current month
            int currentMonth = today.getMonthValue();
            List<User> newJoiners = userRepository.findAll().stream()
                .filter(u -> u.getJoiningDate() != null && u.getJoiningDate().getMonthValue() == currentMonth)
                .limit(5)
                .collect(Collectors.toList());
            List<Map<String, Object>> njList = newJoiners.stream().map(u -> {
                Map<String, Object> m = new HashMap<>();
                m.put("name", u.getFullName());
                m.put("role", u.getRole());
                m.put("joining_date", u.getJoiningDate() != null ? u.getJoiningDate().toString() : null);
                return m;
            }).collect(Collectors.toList());
            widget2.put("data", njList);
            widgets.add(widget2);
            responseData.put("widgets", widgets);

            responseData.put("sidebar_menus", Arrays.asList(
                createMenu("Dashboard", "/dashboard", "LayoutDashboard"),
                createMenu("Employees", "/employees", "Users"),
                createMenu("Departments", "/departments", "Folder"),
                createMenu("Recruitment", "/recruitment", "Briefcase"),
                createMenu("Attendance", "/attendance", "Clock"),
                createMenu("Leave Management", "/leaves", "Calendar"),
                createMenu("Reports & Analytics", "/reports", "BarChart"),
                createMenu("Notifications", "/notifications", "Bell"),
                createMenu("Settings", "/settings", "Settings")
            ));

            responseData.put("quick_actions", Arrays.asList(
                createAction("Create Employee", "create_employee", "/employees/create"),
                createAction("Post Job Requisition", "create_job", "/recruitment/requisitions/create"),
                createAction("Configure Leave", "configure_leave", "/leaves/config")
            ));

            responseData.put("permissions", Arrays.asList("manage_employees", "assign_roles", "view_analytics", "access_recruitment", "manage_departments"));
        }

        // 4. RECRUITER DASHBOARD
        else if ("recruiter".equals(role)) {
            long openJobs = jobRequisitionRepository.countByStatus("open");
            long candidates = candidateRepository.count();
            // Count interviews today
            LocalDateTime startOfDay = today.atStartOfDay();
            LocalDateTime endOfDay = today.atTime(LocalTime.MAX);
            long interviews = interviewRoundRepository.countByStatusAndScheduledDateBetween("scheduled", startOfDay, endOfDay);
            long offers = offerLetterRepository.countByStatus("sent");

            List<Map<String, Object>> statsCards = new ArrayList<>();
            statsCards.add(createCard("Open Jobs", String.valueOf(openJobs), "Briefcase", "Active postings", "blue"));
            statsCards.add(createCard("Candidates Applied", String.valueOf(candidates), "Users", "Talent pool", "indigo"));
            statsCards.add(createCard("Interviews Today", String.valueOf(interviews), "Calendar", "Scheduled rounds", "purple"));
            statsCards.add(createCard("Offers Released", String.valueOf(offers), "UserCheck", "Awaiting acceptance", "emerald"));
            responseData.put("stats_cards", statsCards);

            // Widgets
            List<Map<String, Object>> widgets = new ArrayList<>();
            Map<String, Object> widget1 = new HashMap<>();
            widget1.put("type", "recruitment_pipeline");
            widget1.put("title", "Candidates by Stage");
            List<Map<String, Object>> pipeline = new ArrayList<>();
            pipeline.add(createStage("Applied", candidateRepository.countByStatus("applied")));
            pipeline.add(createStage("Shortlisted", candidateRepository.countByStatus("shortlisted")));
            pipeline.add(createStage("Interviewing", candidateRepository.countByStatus("interview_scheduled")));
            pipeline.add(createStage("Offered", candidateRepository.countByStatus("offered")));
            widget1.put("data", pipeline);
            widgets.add(widget1);
            responseData.put("widgets", widgets);

            responseData.put("sidebar_menus", Arrays.asList(
                createMenu("Dashboard", "/dashboard", "LayoutDashboard"),
                createMenu("Job Postings", "/jobs", "Briefcase"),
                createMenu("Candidates", "/candidates", "Users"),
                createMenu("Interviews", "/interviews", "Calendar"),
                createMenu("Offers", "/offers", "UserCheck"),
                createMenu("Reports", "/reports", "BarChart"),
                createMenu("Notifications", "/notifications", "Bell")
            ));

            responseData.put("quick_actions", Arrays.asList(
                createAction("Post Job Requisition", "create_job", "/jobs/create"),
                createAction("Schedule Interview", "schedule_interview", "/interviews/schedule"),
                createAction("Draft Offer", "create_offer", "/offers/create")
            ));

            responseData.put("permissions", Arrays.asList("manage_job_postings", "schedule_interviews", "manage_candidates", "release_offers"));
        }

        // 5. PAYROLL DASHBOARD
        else if ("payroll".equals(role)) {
            long processedRuns = payrollRunRepository.countByStatus("processed");
            long pendingPayslips = payslipRepository.countByStatus("draft");

            // Aggregates
            BigDecimal expenses = payslipRepository.sumNetSalaryByStatusIn(Arrays.asList("generated", "approved", "disbursed"));
            BigDecimal deductions = payslipRepository.sumTotalDeductionsByStatusIn(Arrays.asList("generated", "approved", "disbursed"));
            if (expenses == null) expenses = BigDecimal.ZERO;
            if (deductions == null) deductions = BigDecimal.ZERO;

            List<Map<String, Object>> statsCards = new ArrayList<>();
            statsCards.add(createCard("Payroll Processed", String.valueOf(processedRuns), "DollarSign", "Completed runs", "emerald"));
            statsCards.add(createCard("Pending Payslips", String.valueOf(pendingPayslips), "FileText", "Awaiting actions", "blue"));
            statsCards.add(createCard("Salary Expenses", String.format("₹%,.0f", expenses), "TrendingUp", "Active salaries", "indigo"));
            statsCards.add(createCard("Deductions", String.format("₹%,.0f", deductions), "TrendingDown", "PF, Tax, etc.", "rose"));
            responseData.put("stats_cards", statsCards);

            // Widgets
            List<Map<String, Object>> widgets = new ArrayList<>();
            Map<String, Object> widget1 = new HashMap<>();
            widget1.put("type", "payroll_summary");
            widget1.put("title", "Payroll Processing Summaries");
            Map<String, Object> pSummary = new HashMap<>();
            pSummary.put("processed", payslipRepository.countByStatus("disbursed"));
            pSummary.put("draft", payslipRepository.countByStatus("draft"));
            pSummary.put("generated", payslipRepository.countByStatus("generated"));
            widget1.put("data", pSummary);
            widgets.add(widget1);
            responseData.put("widgets", widgets);

            responseData.put("sidebar_menus", Arrays.asList(
                createMenu("Dashboard", "/dashboard", "LayoutDashboard"),
                createMenu("Payroll Runs", "/payroll-runs", "DollarSign"),
                createMenu("Salary Structure", "/salary-structures", "Folder"),
                createMenu("Payslips", "/payslips", "FileText"),
                createMenu("Deductions", "/deductions", "TrendingDown"),
                createMenu("Reports", "/reports", "BarChart"),
                createMenu("Settings", "/settings", "Settings")
            ));

            responseData.put("quick_actions", Arrays.asList(
                createAction("Run Monthly Payroll", "run_payroll", "/payroll-runs"),
                createAction("Generate Payslip", "generate_payslips", "/payslips/generate")
            ));

            responseData.put("permissions", Arrays.asList("process_payroll", "generate_payslips", "view_salary_reports", "manage_deductions"));
        }

        // 6. ADMIN DASHBOARD
        else {
            long totalUsers = userRepository.count();
            LocalDateTime startOfToday = today.atStartOfDay();
            long activeSessions = auditLogRepository.countByActionAndTimestampAfter("login", startOfToday);
            long logsCount = auditLogRepository.count();

            List<Map<String, Object>> statsCards = new ArrayList<>();
            statsCards.add(createCard("Total Users", String.valueOf(totalUsers), "Users", "Active accounts", "blue"));
            statsCards.add(createCard("Active Sessions", String.valueOf(activeSessions), "Activity", "Today's logins", "emerald"));
            statsCards.add(createCard("System Logs", String.valueOf(logsCount), "Shield", "Audit size", "purple"));
            statsCards.add(createCard("Security Alerts", "0", "AlertTriangle", "All safe", "green"));
            responseData.put("stats_cards", statsCards);

            // Widgets
            List<Map<String, Object>> widgets = new ArrayList<>();
            Map<String, Object> widget1 = new HashMap<>();
            widget1.put("type", "audit_logs");
            widget1.put("title", "System Activity Log");
            List<AuditLog> auditLogs = auditLogRepository.findTop10ByOrderByTimestampDesc();
            List<Map<String, Object>> auditMapList = auditLogs.stream().map(log -> {
                Map<String, Object> m = new HashMap<>();
                m.put("email", log.getUser() != null ? log.getUser().getEmail() : "System");
                m.put("action", log.getAction());
                m.put("model", log.getModelName());
                m.put("time", log.getTimestamp() != null ? log.getTimestamp().toString() : null);
                return m;
            }).collect(Collectors.toList());
            widget1.put("data", auditMapList);
            widgets.add(widget1);

            Map<String, Object> widget2 = new HashMap<>();
            widget2.put("type", "role_distribution");
            widget2.put("title", "Dynamic Role Distribution");
            // Group users by role
            List<User> allUsers = userRepository.findAll();
            Map<String, Long> roleCounts = allUsers.stream()
                .collect(Collectors.groupingBy(u -> u.getRole() != null ? u.getRole() : "employee", Collectors.counting()));
            List<Map<String, Object>> roleDist = roleCounts.entrySet().stream().map(entry -> {
                Map<String, Object> m = new HashMap<>();
                m.put("role", entry.getKey());
                m.put("value", entry.getValue());
                return m;
            }).collect(Collectors.toList());
            widget2.put("data", roleDist);
            widgets.add(widget2);

            Map<String, Object> widget3 = new HashMap<>();
            widget3.put("type", "department_budgets");
            widget3.put("title", "Department Budget Allocations");
            List<Department> depts = departmentRepository.findAll();
            List<Map<String, Object>> deptBudgets = depts.stream().map(d -> {
                Map<String, Object> m = new HashMap<>();
                m.put("name", d.getName());
                m.put("budget", d.getBudget());
                return m;
            }).collect(Collectors.toList());
            widget3.put("data", deptBudgets);
            widgets.add(widget3);

            Map<String, Object> widget4 = new HashMap<>();
            widget4.put("type", "recent_users");
            widget4.put("title", "Recently Onboarded Team Associates");
            // Order by ID desc for recent onboarding
            List<User> recentUsers = allUsers.stream()
                .sorted((u1, u2) -> u2.getId().compareTo(u1.getId()))
                .limit(5)
                .collect(Collectors.toList());
            List<Map<String, Object>> ruMapList = recentUsers.stream().map(u -> {
                Map<String, Object> m = new HashMap<>();
                m.put("full_name", u.getFullName());
                m.put("email", u.getEmail());
                m.put("role", u.getRole());
                m.put("date", u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
                return m;
            }).collect(Collectors.toList());
            widget4.put("data", ruMapList);
            widgets.add(widget4);
            responseData.put("widgets", widgets);

            responseData.put("sidebar_menus", Arrays.asList(
                createMenu("Dashboard", "/dashboard", "LayoutDashboard"),
                createMenu("Users", "/users", "Users"),
                createMenu("Roles & Permissions", "/roles", "Shield"),
                createMenu("System Settings", "/settings", "Settings"),
                createMenu("Audit Logs", "/audit-logs", "FileText"),
                createMenu("Departments", "/departments", "Folder"),
                createMenu("Policies", "/policies", "BookOpen"),
                createMenu("Reports", "/reports", "BarChart"),
                createMenu("Configurations", "/configs", "Sliders")
            ));

            responseData.put("quick_actions", Arrays.asList(
                createAction("Register User", "create_user", "/users/create"),
                createAction("Assign Permissions", "assign_roles", "/roles/assign"),
                createAction("View Security Logs", "view_security_logs", "/audit-logs")
            ));

            responseData.put("permissions", Arrays.asList("full_system_access", "manage_users", "assign_roles", "configure_system", "access_audit_logs", "security_management"));
        }

        return ResponseEntity.ok(responseData);
    }

    // Helper methods for central dashboard
    private Map<String, Object> createCard(String title, String value, String icon, String trend, String color) {
        Map<String, Object> m = new HashMap<>();
        m.put("title", title);
        m.put("value", value);
        m.put("icon", icon);
        m.put("trend", trend);
        m.put("color", color);
        return m;
    }

    private Map<String, Object> createHoliday(String name, String date) {
        Map<String, Object> m = new HashMap<>();
        m.put("name", name);
        m.put("date", date);
        return m;
    }

    private Map<String, Object> createMenu(String title, String path, String icon) {
        Map<String, Object> m = new HashMap<>();
        m.put("title", title);
        m.put("path", path);
        m.put("icon", icon);
        return m;
    }

    private Map<String, Object> createAction(String title, String action, String path) {
        Map<String, Object> m = new HashMap<>();
        m.put("title", title);
        m.put("action", action);
        m.put("path", path);
        return m;
    }

    private Map<String, Object> createStage(String stage, long count) {
        Map<String, Object> m = new HashMap<>();
        m.put("stage", stage);
        m.put("count", count);
        return m;
    }

    // --- SUB-DASHBOARD REDIRECT PATHS & API VIEWS ---

    @GetMapping("/employee/dashboard/")
    public ResponseEntity<?> getEmployeeDashboard(Principal principal) {
        return getCentralDashboard(principal);
    }

    @GetMapping("/employee/profile/")
    public ResponseEntity<?> getEmployeeProfile(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<EmployeeProfile> profileOpt = employeeProfileRepository.findByUserUsername(principal.getName());
        if (profileOpt.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(getProfileMap(profileOpt.get()));
    }

    @PostMapping("/leave/apply/")
    public ResponseEntity<?> applyLeaveDashboard(@RequestBody Map<String, Object> request, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        Long leaveTypeId = ((Number) request.get("leave_type")).longValue();
        Optional<LeaveType> ltOpt = leaveTypeRepository.findById(leaveTypeId);
        if (ltOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Leave type not found"));
        }

        LocalDate start = LocalDate.parse((String) request.get("start_date"));
        LocalDate end = LocalDate.parse((String) request.get("end_date"));
        String reason = (String) request.get("reason");

        int numDays = (int) ChronoUnit.DAYS.between(start, end) + 1;
        String finYear = "2026-2027"; // Mock financial year

        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndFinancialYear(
                userOpt.get().getId(), ltOpt.get().getId(), finYear)
                .orElseGet(() -> {
                    LeaveBalance b = LeaveBalance.builder()
                            .employee(userOpt.get())
                            .leaveType(ltOpt.get())
                            .financialYear(finYear)
                            .totalDays(ltOpt.get().getMaxDaysPerYear())
                            .usedDays(0)
                            .pendingDays(0)
                            .build();
                    return leaveBalanceRepository.save(b);
                });

        if (numDays > balance.getAvailableDays()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error",
                    "Insufficient leave balance. Requested " + numDays + ", available " + balance.getAvailableDays()));
        }

        LeaveApplication app = LeaveApplication.builder()
                .employee(userOpt.get())
                .leaveType(ltOpt.get())
                .startDate(start)
                .endDate(end)
                .reason(reason)
                .status("pending")
                .build();

        leaveApplicationRepository.save(app);

        balance.setPendingDays(balance.getPendingDays() + numDays);
        leaveBalanceRepository.save(balance);

        return ResponseEntity.status(HttpStatus.CREATED).body(app);
    }

    @GetMapping("/attendance/me/")
    public ResponseEntity<?> getAttendanceMe(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        List<AttendanceRecord> records = attendanceRecordRepository.findByEmployeeIdAndDateBetween(
                userOpt.get().getId(), LocalDate.now().minusDays(30), LocalDate.now());
        return ResponseEntity.ok(records);
    }

    @GetMapping("/payslips/me/")
    public ResponseEntity<?> getPayslipsMe(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        List<Payslip> payslips = payslipRepository.findByEmployeeId(userOpt.get().getId());
        return ResponseEntity.ok(payslips);
    }

    @GetMapping("/notifications/me/")
    public ResponseEntity<?> getNotificationsMe(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        List<Notification> notifs = notificationRepository.findByRecipientId(userOpt.get().getId());
        return ResponseEntity.ok(notifs);
    }

    // --- MANAGER SPECIFIC VIEWS ---

    @GetMapping("/manager/dashboard/")
    public ResponseEntity<?> getManagerDashboard(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (!userOpt.get().isManager()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Collections.singletonMap("error", "Unauthorized"));
        }
        return getCentralDashboard(principal);
    }

    @GetMapping("/manager/team/")
    public ResponseEntity<?> getManagerTeam(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        List<EmployeeProfile> members = employeeProfileRepository.findByReportingManagerId(userOpt.get().getId());
        List<Map<String, Object>> list = members.stream().map(this::getProfileMap).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/manager/leave-requests/")
    public ResponseEntity<?> getManagerLeaveRequests(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        User user = userOpt.get();
        List<LeaveApplication> requests;
        if (user.isHrStaff()) {
            requests = leaveApplicationRepository.findByStatus("pending");
        } else {
            requests = leaveApplicationRepository.findByReportingManagerIdAndStatus(user.getId(), "pending");
            // Exclude manager's own requests
            requests = requests.stream().filter(r -> !r.getEmployee().getId().equals(user.getId())).collect(Collectors.toList());
        }
        return ResponseEntity.ok(requests);
    }

    @PostMapping("/manager/approve-leave/")
    public ResponseEntity<?> managerApproveLeave(@RequestBody Map<String, Object> request, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        Long appId = ((Number) request.get("leave_application_id")).longValue();
        String status = (String) request.get("status");
        String remarks = (String) request.getOrDefault("approval_remarks", "");

        if (!"approved".equals(status) && !"rejected".equals(status)) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Invalid status"));
        }

        Optional<LeaveApplication> appOpt = leaveApplicationRepository.findById(appId);
        if (appOpt.isEmpty()) return ResponseEntity.notFound().build();

        LeaveApplication app = appOpt.get();
        User currentUser = userOpt.get();

        // Security check
        if (!currentUser.isHrStaff()) {
            Optional<EmployeeProfile> empProfOpt = employeeProfileRepository.findByUserId(app.getEmployee().getId());
            if (empProfOpt.isEmpty() || empProfOpt.get().getReportingManager() == null ||
                    !empProfOpt.get().getReportingManager().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Collections.singletonMap("error", "Unauthorized to approve this leave"));
            }
        }

        if (app.getEmployee().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Collections.singletonMap("error", "You cannot approve your own leave application"));
        }

        app.setStatus(status);
        app.setApprovedBy(currentUser);
        app.setApprovalRemarks(remarks);
        app.setApprovalDate(LocalDateTime.now());
        leaveApplicationRepository.save(app);

        // Update leave balance
        String finYear = "2026-2027";
        Optional<LeaveBalance> balOpt = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndFinancialYear(
                app.getEmployee().getId(), app.getLeaveType().getId(), finYear);

        if (balOpt.isPresent()) {
            LeaveBalance bal = balOpt.get();
            int numDays = app.getNumberOfDays();
            bal.setPendingDays(Math.max(0, bal.getPendingDays() - numDays));
            if ("approved".equals(status)) {
                bal.setUsedDays(bal.getUsedDays() + numDays);

                // Setup attendance records
                LocalDate curr = app.getStartDate();
                while (!curr.isAfter(app.getEndDate())) {
                    AttendanceRecord ar = attendanceRecordRepository.findByEmployeeIdAndDate(app.getEmployee().getId(), curr)
                            .orElseGet(() -> AttendanceRecord.builder().employee(app.getEmployee()).date(curr).build());
                    ar.setStatus("leave");
                    ar.setRemarks("On Approved Leave");
                    attendanceRecordRepository.save(ar);
                    curr = curr.plusDays(1);
                }
            }
            leaveBalanceRepository.save(bal);
        }

        return ResponseEntity.ok(app);
    }

    @GetMapping("/manager/performance/")
    public ResponseEntity<?> getManagerPerformance(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        List<EmployeeAppraisal> appraisals = employeeAppraisalRepository.findByManagerId(userOpt.get().getId());
        return ResponseEntity.ok(appraisals);
    }

    @GetMapping("/manager/team-attendance/")
    public ResponseEntity<?> getManagerTeamAttendance(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        List<AttendanceRecord> records = attendanceRecordRepository.findByReportingManagerId(userOpt.get().getId());
        return ResponseEntity.ok(records);
    }

    // --- HR SPECIFIC VIEWS ---

    @GetMapping("/hr/dashboard/")
    public ResponseEntity<?> getHRDashboard(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty() || !userOpt.get().isHrStaff()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Collections.singletonMap("error", "Unauthorized"));
        }
        return getCentralDashboard(principal);
    }

    @GetMapping("/employees/")
    public ResponseEntity<?> getHREmployees() {
        List<EmployeeProfile> list = employeeProfileRepository.findAll();
        List<Map<String, Object>> mapList = list.stream().map(this::getProfileMap).collect(Collectors.toList());
        return ResponseEntity.ok(mapList);
    }

    @PostMapping("/employees/create/")
    public ResponseEntity<?> hrCreateEmployee(@RequestBody Map<String, Object> request, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> reqUserOpt = userService.findByUsername(principal.getName());
        if (reqUserOpt.isEmpty()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        User reqUser = reqUserOpt.get();
        String reqRole = reqUser.getRole() != null ? reqUser.getRole().toLowerCase() : "";

        String email = (String) request.get("email");
        String password = (String) request.get("password");
        String fullName = (String) request.get("full_name");
        String role = request.get("role") != null ? ((String) request.get("role")).toLowerCase() : "employee";
        String deptName = (String) request.get("department");
        String desigName = (String) request.get("designation");

        if (email == null || password == null || fullName == null) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Missing core fields"));
        }

        // Auth check
        if ("hr".equals(reqRole)) {
            List<String> allowed = Arrays.asList("employee", "manager", "recruiter");
            if (!allowed.contains(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Collections.singletonMap("error",
                        "HR is not authorised to create a user with role \"" + role + "\". Allowed roles: " + allowed));
            }
        } else if ("admin".equals(reqRole)) {
            List<String> allowed = Arrays.asList("employee", "manager", "recruiter", "hr", "payroll");
            if (!allowed.contains(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Collections.singletonMap("error",
                        "Admin cannot create an \"admin\" account. Only a Super Admin can create Admin users."));
            }
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Collections.singletonMap("error",
                    "You do not have permission to create user accounts."));
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Email already exists"));
        }

        // Generate username
        String baseUsername = email.split("@")[0];
        String username = baseUsername;
        int counter = 1;
        while (userRepository.findByUsername(username).isPresent()) {
            username = baseUsername + counter;
            counter++;
        }

        User newUser = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(password))
                .fullName(fullName)
                .role(role)
                .department(deptName)
                .designation(desigName)
                .status("active")
                .isActive(true)
                .build();

        User savedUser = userService.saveUser(newUser);

        EmployeeProfile profile = EmployeeProfile.builder()
                .user(savedUser)
                .employmentType("permanent")
                .status("active")
                .build();

        if (deptName != null && !deptName.trim().isEmpty()) {
            Department dept = departmentRepository.findByName(deptName)
                    .orElseGet(() -> departmentRepository.save(Department.builder().name(deptName).status("active").build()));
            profile.setDepartment(dept);

            if (desigName != null && !desigName.trim().isEmpty()) {
                Designation desig = designationRepository.findByName(desigName)
                        .orElseGet(() -> designationRepository.save(Designation.builder().name(desigName).department(dept).build()));
                profile.setDesignation(desig);
            }
        }

        employeeProfileRepository.save(profile);
        return ResponseEntity.status(HttpStatus.CREATED).body(getProfileMap(profile));
    }

    @PutMapping("/employees/update/{id}/")
    public ResponseEntity<?> hrUpdateEmployee(@PathVariable("id") Long id, @RequestBody Map<String, Object> request) {
        Optional<EmployeeProfile> profileOpt = employeeProfileRepository.findById(id);
        if (profileOpt.isEmpty()) return ResponseEntity.notFound().build();

        EmployeeProfile profile = profileOpt.get();
        User u = profile.getUser();

        if (request.containsKey("full_name")) {
            u.setFullName((String) request.get("full_name"));
        }
        if (request.containsKey("role")) {
            u.setRole((String) request.get("role"));
        }
        if (request.containsKey("phone")) {
            u.setPhone((String) request.get("phone"));
        }
        userRepository.save(u);

        if (request.containsKey("employment_type")) {
            profile.setEmploymentType((String) request.get("employment_type"));
        }
        if (request.containsKey("status")) {
            profile.setStatus((String) request.get("status"));
        }
        if (request.containsKey("contact_number")) {
            profile.setContactNumber((String) request.get("contact_number"));
        }
        if (request.containsKey("personal_email")) {
            profile.setPersonalEmail((String) request.get("personal_email"));
        }
        if (request.containsKey("office_location")) {
            profile.setOfficeLocation((String) request.get("office_location"));
        }

        employeeProfileRepository.save(profile);
        return ResponseEntity.ok(getProfileMap(profile));
    }

    @GetMapping("/departments/")
    public ResponseEntity<?> getHRDepartments() {
        List<Department> depts = departmentRepository.findAll();
        List<Map<String, Object>> list = depts.stream().map(d -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", d.getId());
            m.put("name", d.getName());
            m.put("description", d.getDescription());
            m.put("budget", d.getBudget());
            m.put("cost_centre_code", d.getCostCentreCode());
            m.put("status", d.getStatus());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/analytics/hr/")
    public ResponseEntity<?> getHRAnalytics() {
        Optional<AnalyticsSnapshot> snapOpt = analyticsSnapshotRepository.findTopByOrderBySnapshotDateDesc();
        if (snapOpt.isEmpty()) {
            Map<String, Object> map = new HashMap<>();
            map.put("snapshot_date", LocalDate.now().toString());
            map.put("total_employees", 0);
            map.put("active_employees", 0);
            map.put("on_leave_employees", 0);
            map.put("attrition_rate", 0.0);
            map.put("open_positions", 0);
            map.put("average_attendance_rate", 0.0);
            return ResponseEntity.ok(map);
        }
        return ResponseEntity.ok(snapOpt.get());
    }

    @Autowired
    private AnalyticsSnapshotRepository analyticsSnapshotRepository;

    @GetMapping("/recruitment/overview/")
    public ResponseEntity<?> getHRRecruitmentOverview() {
        Map<String, Object> data = new HashMap<>();
        data.put("requisitions", jobRequisitionRepository.count());
        data.put("candidates", candidateRepository.count());
        data.put("offers", offerLetterRepository.count());
        return ResponseEntity.ok(data);
    }

    // --- RECRUITER SPECIFIC VIEWS ---

    @GetMapping("/recruiter/dashboard/")
    public ResponseEntity<?> getRecruiterDashboard(Principal principal) {
        return getCentralDashboard(principal);
    }

    @PostMapping("/jobs/create/")
    public ResponseEntity<?> recruiterCreateJob(@RequestBody Map<String, Object> request, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        String title = (String) request.get("title");
        String deptName = (String) request.get("department_name");
        Long deptId = request.get("department") != null ? ((Number) request.get("department")).longValue() : null;
        String gradeStr = (String) request.get("grade");
        int vacancies = request.get("vacancies_count") != null ? ((Number) request.get("vacancies_count")).intValue() : 1;
        String reqStatus = (String) request.getOrDefault("status", "open");

        Department dept = null;
        if (deptId != null) {
            dept = departmentRepository.findById(deptId).orElse(null);
        } else if (deptName != null) {
            dept = departmentRepository.findByName(deptName).orElse(null);
        }

        JobRequisition req = JobRequisition.builder()
                .title(title)
                .department(dept)
                .grade(gradeStr)
                .vacanciesCount(vacancies)
                .status(reqStatus)
                .createdBy(userOpt.get())
                .build();

        jobRequisitionRepository.save(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(req);
    }

    @GetMapping("/candidates/")
    public ResponseEntity<?> recruiterGetCandidates() {
        List<Candidate> candidates = candidateRepository.findAll();
        List<Map<String, Object>> list = candidates.stream().map(c -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("full_name", c.getFullName());
            m.put("email", c.getEmail());
            m.put("phone", c.getPhone());
            m.put("status", c.getStatus());
            m.put("job_requisition", c.getJobRequisition() != null ? c.getJobRequisition().getId() : null);
            m.put("job_title", c.getJobRequisition() != null ? c.getJobRequisition().getTitle() : null);
            m.put("applied_date", c.getCreatedAt() != null ? c.getCreatedAt().toString() : null);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @PostMapping("/interviews/schedule/")
    public ResponseEntity<?> recruiterScheduleInterview(@RequestBody Map<String, Object> request) {
        Long candidateId = ((Number) request.get("candidate")).longValue();
        Optional<Candidate> candOpt = candidateRepository.findById(candidateId);
        if (candOpt.isEmpty()) return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Candidate not found"));

        String roundName = (String) request.get("round_name");
        LocalDateTime scheduled = LocalDateTime.parse((String) request.get("scheduled_date"));
        String mode = (String) request.getOrDefault("mode", "online");
        String meet = (String) request.get("meeting_link");

        InterviewRound round = InterviewRound.builder()
                .candidate(candOpt.get())
                .roundName(roundName)
                .scheduledDate(scheduled)
                .mode(mode)
                .meetingLink(meet)
                .status("scheduled")
                .build();

        interviewRoundRepository.save(round);
        return ResponseEntity.status(HttpStatus.CREATED).body(round);
    }

    @PostMapping("/offers/create/")
    public ResponseEntity<?> recruiterCreateOffer(@RequestBody Map<String, Object> request) {
        Long candidateId = ((Number) request.get("candidate")).longValue();
        Optional<Candidate> candOpt = candidateRepository.findById(candidateId);
        if (candOpt.isEmpty()) return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Candidate not found"));

        BigDecimal salary = new BigDecimal(request.get("offered_salary").toString());
        LocalDate joining = LocalDate.parse((String) request.get("joining_date"));
        LocalDate validity = LocalDate.parse((String) request.get("validity_date"));

        OfferLetter offer = OfferLetter.builder()
                .candidate(candOpt.get())
                .offeredSalary(salary)
                .joiningDate(joining)
                .validityDate(validity)
                .status("sent")
                .build();

        offerLetterRepository.save(offer);
        return ResponseEntity.status(HttpStatus.CREATED).body(offer);
    }

    @GetMapping("/recruitment/analytics/")
    public ResponseEntity<?> getRecruiterAnalytics() {
        Map<String, Object> data = new HashMap<>();
        List<Map<String, Object>> pipeline = new ArrayList<>();
        pipeline.add(createStage("Applied", candidateRepository.countByStatus("applied")));
        pipeline.add(createStage("Interviewing", candidateRepository.countByStatus("interview_scheduled")));
        pipeline.add(createStage("Offered", candidateRepository.countByStatus("offered")));
        data.put("pipeline", pipeline);
        return ResponseEntity.ok(data);
    }

    // --- PAYROLL SPECIFIC VIEWS ---

    @GetMapping("/payroll/dashboard/")
    public ResponseEntity<?> getPayrollDashboard(Principal principal) {
        return getCentralDashboard(principal);
    }

    @PostMapping("/payroll/process/")
    public ResponseEntity<?> payrollProcessRun(@RequestBody Map<String, Object> request) {
        String monthYear = (String) request.get("month_year");
        if (monthYear == null || monthYear.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "month_year is required"));
        }

        PayrollRun run = payrollRunRepository.findByMonthYear(monthYear)
                .orElseGet(() -> payrollRunRepository.save(PayrollRun.builder()
                        .monthYear(monthYear)
                        .status("draft")
                        .totalEmployees(0)
                        .totalSalary(BigDecimal.ZERO)
                        .totalDeductions(BigDecimal.ZERO)
                        .totalNetSalary(BigDecimal.ZERO)
                        .build()));

        // Process payroll logic: fetch all active employee profiles and create payslips
        List<EmployeeProfile> employees = employeeProfileRepository.findAll().stream()
                .filter(e -> "active".equals(e.getStatus())).collect(Collectors.toList());

        BigDecimal totalSal = BigDecimal.ZERO;
        BigDecimal totalDed = BigDecimal.ZERO;
        BigDecimal totalNet = BigDecimal.ZERO;

        for (EmployeeProfile emp : employees) {
            if (payslipRepository.findByPayrollRunIdAndEmployeeId(run.getId(), emp.getUser().getId()).isPresent()) {
                continue;
            }

            // Simple basic calculations based on Grade baseSalary
            BigDecimal baseSalary = emp.getGrade() != null ? emp.getGrade().getBaseSalary() : new BigDecimal("30000");
            BigDecimal allowance = baseSalary.multiply(new BigDecimal("0.10")); // 10% allowance
            BigDecimal deductions = baseSalary.multiply(new BigDecimal("0.12")); // 12% PF/Tax
            BigDecimal gross = baseSalary.add(allowance);
            BigDecimal net = gross.subtract(deductions);

            Payslip payslip = Payslip.builder()
                    .payrollRun(run)
                    .employee(emp.getUser())
                    .basicSalary(baseSalary)
                    .allowances(allowance)
                    .grossSalary(gross)
                    .deductions(deductions)
                    .netSalary(net)
                    .totalDeductions(deductions)
                    .status("draft")
                    .build();

            payslipRepository.save(payslip);

            totalSal = totalSal.add(gross);
            totalDed = totalDed.add(deductions);
            totalNet = totalNet.add(net);
        }

        run.setStatus("processed");
        run.setTotalEmployees(employees.size());
        run.setTotalSalary(totalSal);
        run.setTotalDeductions(totalDed);
        run.setTotalNetSalary(totalNet);
        payrollRunRepository.save(run);

        return ResponseEntity.ok(run);
    }

    @GetMapping("/salary-structures/")
    public ResponseEntity<?> getSalaryStructures() {
        return ResponseEntity.ok(salaryStructureRepository.findAll());
    }

    @GetMapping("/payslips/")
    public ResponseEntity<?> getPayslipsList() {
        return ResponseEntity.ok(payslipRepository.findAll());
    }

    @PostMapping("/payslips/generate/")
    public ResponseEntity<?> generatePayslips(@RequestBody Map<String, Object> request) {
        return payrollProcessRun(request);
    }

    @GetMapping("/payroll/reports/")
    public ResponseEntity<?> getPayrollReports() {
        BigDecimal expenses = payslipRepository.sumAllNetSalary();
        BigDecimal deductions = payslipRepository.sumAllTotalDeductions();
        if (expenses == null) expenses = BigDecimal.ZERO;
        if (deductions == null) deductions = BigDecimal.ZERO;

        Map<String, Object> data = new HashMap<>();
        data.put("total_salary_expense", expenses);
        data.put("total_deductions", deductions);
        return ResponseEntity.ok(data);
    }

    // --- ADMIN SPECIFIC VIEWS ---

    @GetMapping("/admin/dashboard/")
    public ResponseEntity<?> getAdminDashboard(Principal principal) {
        return getCentralDashboard(principal);
    }

    @GetMapping("/users/")
    public ResponseEntity<?> getAdminUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping("/users/create/")
    public ResponseEntity<?> adminCreateUser(@RequestBody Map<String, Object> request, Principal principal) {
        return hrCreateEmployee(request, principal);
    }

    @RequestMapping(value = "/roles/assign/", method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<?> adminAssignRole(@RequestBody Map<String, Object> request, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> reqUserOpt = userService.findByUsername(principal.getName());
        if (reqUserOpt.isEmpty()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        User reqUser = reqUserOpt.get();
        String reqRole = reqUser.getRole() != null ? reqUser.getRole().toLowerCase() : "";

        Long userId = ((Number) request.get("user_id")).longValue();
        String roleStr = (String) request.get("role");
        String deptIdVal = request.get("department_id") != null ? request.get("department_id").toString() : null;
        if (deptIdVal == null && request.containsKey("department")) {
            deptIdVal = request.get("department") != null ? request.get("department").toString() : null;
        }

        String desigIdVal = request.get("designation_id") != null ? request.get("designation_id").toString() : null;
        if (desigIdVal == null && request.containsKey("designation")) {
            desigIdVal = request.get("designation") != null ? request.get("designation").toString() : null;
        }

        String managerIdVal = request.get("reporting_manager_id") != null ? request.get("reporting_manager_id").toString() : null;
        if (managerIdVal == null && request.containsKey("reporting_manager")) {
            managerIdVal = request.get("reporting_manager") != null ? request.get("reporting_manager").toString() : null;
        }

        String office = (String) request.get("office_location");
        Boolean active = (Boolean) request.get("is_active");

        // Role restriction checks
        if (roleStr != null) {
            String roleLower = roleStr.toLowerCase();
            if ("hr".equals(reqRole)) {
                List<String> allowed = Arrays.asList("employee", "manager", "recruiter");
                if (!allowed.contains(roleLower)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Collections.singletonMap("error",
                            "HR cannot assign the role \"" + roleStr + "\". Allowed roles: " + allowed));
                }
            } else if ("admin".equals(reqRole)) {
                List<String> allowed = Arrays.asList("employee", "manager", "recruiter", "hr", "payroll");
                if (!allowed.contains(roleLower)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Collections.singletonMap("error",
                            "Admin cannot assign the \"admin\" role. Only a Super Admin can grant Admin privileges."));
                }
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Collections.singletonMap("error",
                        "You do not have permission to assign roles."));
            }
        }

        Optional<User> targetOpt = userRepository.findById(userId);
        if (targetOpt.isEmpty()) return ResponseEntity.notFound().build();

        User target = targetOpt.get();
        if (roleStr != null) {
            target.setRole(roleStr.toLowerCase());
        }
        if (active != null) {
            target.setActive(active);
        }

        EmployeeProfile profile = employeeProfileRepository.findByUserId(userId)
                .orElseGet(() -> employeeProfileRepository.save(EmployeeProfile.builder().user(target).build()));

        if (deptIdVal != null) {
            if (deptIdVal.isEmpty()) {
                profile.setDepartment(null);
                target.setDepartment(null);
            } else {
                Department dept = null;
                try {
                    Long dId = Long.parseLong(deptIdVal);
                    dept = departmentRepository.findById(dId).orElse(null);
                } catch (NumberFormatException e) {
                    dept = departmentRepository.findByName(deptIdVal).orElse(null);
                }
                if (dept != null) {
                    profile.setDepartment(dept);
                    target.setDepartment(dept.getName());
                } else {
                    return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Department not found"));
                }
            }
        }

        if (desigIdVal != null) {
            if (desigIdVal.isEmpty()) {
                profile.setDesignation(null);
                target.setDesignation(null);
            } else {
                Designation desig = null;
                try {
                    Long dsId = Long.parseLong(desigIdVal);
                    desig = designationRepository.findById(dsId).orElse(null);
                } catch (NumberFormatException e) {
                    desig = designationRepository.findByName(desigIdVal).orElse(null);
                }
                if (desig != null) {
                    profile.setDesignation(desig);
                    target.setDesignation(desig.getName());
                } else {
                    return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Designation not found"));
                }
            }
        }

        if (managerIdVal != null) {
            if (managerIdVal.isEmpty()) {
                profile.setReportingManager(null);
            } else {
                try {
                    Long mId = Long.parseLong(managerIdVal);
                    Optional<User> mgrOpt = userRepository.findById(mId);
                    if (mgrOpt.isPresent()) {
                        profile.setReportingManager(mgrOpt.get());
                    } else {
                        return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Reporting manager not found"));
                    }
                } catch (NumberFormatException e) {
                    return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Invalid manager id format"));
                }
            }
        }

        if (office != null) {
            profile.setOfficeLocation(office);
        }

        userRepository.save(target);
        employeeProfileRepository.save(profile);

        // Audit Log
        AuditLog audit = AuditLog.builder()
                .user(reqUser)
                .action("update")
                .modelName("User")
                .objectId(target.getId())
                .changes(String.format("{\"action\":\"onboard_assignment\",\"role\":\"%s\",\"department\":\"%s\",\"designation\":\"%s\",\"is_active\":%b}",
                        target.getRole(), target.getDepartment(), target.getDesignation(), target.isActive()))
                .build();
        auditLogRepository.save(audit);

        return ResponseEntity.ok(target);
    }

    @GetMapping("/roles/governance/")
    public ResponseEntity<?> getRolesGovernance(Principal principal, @RequestParam(value = "role", required = false) String roleFilter) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> reqUserOpt = userService.findByUsername(principal.getName());
        if (reqUserOpt.isEmpty() || !"admin".equalsIgnoreCase(reqUserOpt.get().getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Collections.singletonMap("error", "Access restricted to System Administrators."));
        }

        List<String> rolesToShow = roleFilter != null ? Collections.singletonList(roleFilter.toLowerCase()) :
                Arrays.asList("admin", "hr", "manager", "recruiter", "payroll", "employee");

        List<Map<String, Object>> governanceData = new ArrayList<>();

        for (String rKey : rolesToShow) {
            Map<String, Object> meta = getRoleMetadata(rKey);
            if (meta == null) continue;

            List<User> users = userRepository.findAll().stream().filter(u -> rKey.equalsIgnoreCase(u.getRole())).collect(Collectors.toList());
            List<Map<String, Object>> userList = new ArrayList<>();

            for (User u : users) {
                Optional<AuditLog> auditOpt = auditLogRepository.findFirstByUserIdAndActionOrderByTimestampDesc(u.getId(), "login");
                Optional<EmployeeProfile> pOpt = employeeProfileRepository.findByUserId(u.getId());

                Map<String, Object> uMap = new HashMap<>();
                uMap.put("id", u.getId());
                uMap.put("employee_id", u.getEmployeeId() != null ? u.getEmployeeId() : String.format("EMP%04d", u.getId()));
                uMap.put("full_name", u.getFullName() != null ? u.getFullName() : u.getEmail().split("@")[0]);
                uMap.put("email", u.getEmail());
                uMap.put("role", u.getRole());
                uMap.put("is_active", u.isActive());
                uMap.put("department", pOpt.map(p -> p.getDepartment() != null ? p.getDepartment().getName() : "—").orElse(u.getDepartment() != null ? u.getDepartment() : "—"));
                uMap.put("designation", pOpt.map(p -> p.getDesignation() != null ? p.getDesignation().getName() : "—").orElse(u.getDesignation() != null ? u.getDesignation() : "—"));
                uMap.put("employment_status", pOpt.map(EmployeeProfile::getStatus).orElse("active"));
                uMap.put("reporting_manager", pOpt.map(p -> p.getReportingManager() != null ? p.getReportingManager().getFullName() : "—").orElse("—"));
                uMap.put("last_login", auditOpt.map(a -> a.getTimestamp().toString()).orElse(null));
                uMap.put("joined_date", u.getJoiningDate() != null ? u.getJoiningDate().toString() : null);
                uMap.put("profile_image", u.getProfileImage());

                userList.add(uMap);
            }

            Map<String, Object> rMap = new HashMap<>(meta);
            rMap.put("role_key", rKey);
            rMap.put("user_count", userList.size());
            rMap.put("active_count", userList.stream().filter(u -> (boolean) u.get("is_active")).count());
            rMap.put("users", userList);

            governanceData.add(rMap);
        }

        return ResponseEntity.ok(governanceData);
    }

    @PostMapping("/roles/governance/action/")
    public ResponseEntity<?> rolesGovernanceAction(@RequestBody Map<String, Object> request, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> reqUserOpt = userService.findByUsername(principal.getName());
        if (reqUserOpt.isEmpty() || !"admin".equalsIgnoreCase(reqUserOpt.get().getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Collections.singletonMap("error", "Admin access required."));
        }

        String action = (String) request.get("action");
        Long userId = ((Number) request.get("user_id")).longValue();

        if (action == null || userId == null) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "action and user_id are required."));
        }

        Optional<User> targetOpt = userRepository.findById(userId);
        if (targetOpt.isEmpty()) return ResponseEntity.notFound().build();

        User target = targetOpt.get();
        String msg = "";
        Map<String, Object> changes = new HashMap<>();
        changes.put("action", action);

        if ("toggle_active".equals(action)) {
            target.setActive(!target.isActive());
            userRepository.save(target);
            changes.put("is_active", target.isActive());
            msg = "Account " + (target.isActive() ? "activated" : "deactivated") + " successfully.";
        } else if ("change_role".equals(action)) {
            String role = (String) request.get("role");
            if (role == null) return ResponseEntity.badRequest().body(Collections.singletonMap("error", "role is required"));
            String roleLower = role.toLowerCase();
            List<String> allowed = Arrays.asList("employee", "manager", "recruiter", "hr", "payroll");
            if (!allowed.contains(roleLower)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Collections.singletonMap("error", "Cannot assign role \"" + role + "\". Allowed: " + allowed));
            }
            changes.put("old_role", target.getRole());
            target.setRole(roleLower);
            userRepository.save(target);
            changes.put("new_role", roleLower);
            msg = "Role changed to \"" + roleLower + "\" successfully.";
        } else if ("transfer_dept".equals(action)) {
            String deptName = (String) request.get("department");
            if (deptName == null) return ResponseEntity.badRequest().body(Collections.singletonMap("error", "department is required"));

            Optional<Department> deptOpt = departmentRepository.findByName(deptName);
            if (deptOpt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("error", "Department not found."));

            Department dept = deptOpt.get();
            EmployeeProfile profile = employeeProfileRepository.findByUserId(userId)
                    .orElseGet(() -> employeeProfileRepository.save(EmployeeProfile.builder().user(target).build()));

            profile.setDepartment(dept);
            employeeProfileRepository.save(profile);

            target.setDepartment(dept.getName());
            userRepository.save(target);

            changes.put("department", deptName);
            msg = "User transferred to department \"" + deptName + "\".";
        } else if ("reset_password".equals(action)) {
            String tempPass = (String) request.getOrDefault("new_password", "TempPass@2026!");
            target.setPassword(passwordEncoder.encode(tempPass));
            userRepository.save(target);
            changes.put("password_reset", true);
            msg = "Password has been reset successfully.";
        } else {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Unknown action: " + action));
        }

        // Audit Log
        AuditLog audit = AuditLog.builder()
                .user(reqUserOpt.get())
                .action("update")
                .modelName("User")
                .objectId(target.getId())
                .changes(changes.entrySet().stream().map(e -> "\"" + e.getKey() + "\":\"" + e.getValue() + "\"").collect(Collectors.joining(",", "{", "}")))
                .build();
        auditLogRepository.save(audit);

        Map<String, Object> response = new HashMap<>();
        response.put("message", msg);
        response.put("user_id", target.getId());
        response.put("action", action);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/audit-logs/")
    public ResponseEntity<?> getAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findAll());
    }

    @GetMapping("/system/analytics/")
    public ResponseEntity<?> getSystemAnalytics() {
        Map<String, Object> data = new HashMap<>();
        data.put("cpu_load", "12%");
        data.put("ram_usage", "42%");
        data.put("active_sessions", auditLogRepository.findByActionIn(Arrays.asList("login")).size());
        return ResponseEntity.ok(data);
    }

    @GetMapping("/security/logs/")
    public ResponseEntity<?> getSecurityLogs() {
        List<AuditLog> logs = auditLogRepository.findByActionIn(Arrays.asList("login", "logout"));
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/cards/")
    public ResponseEntity<?> getDashboardCards(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        List<DashboardCard> cards = dashboardCardRepository.findByApplicableRoleAndIsActiveOrderByPosition(
                userOpt.get().getRole(), true);
        return ResponseEntity.ok(cards);
    }

    private Map<String, Object> getProfileMap(EmployeeProfile p) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", p.getId());
        map.put("employee_id", p.getUser().getEmployeeId());
        map.put("full_name", p.getUser().getFullName());
        map.put("email", p.getUser().getEmail());
        map.put("user", p.getUser().getId());
        map.put("department", p.getDepartment() != null ? p.getDepartment().getId() : null);
        map.put("designation", p.getDesignation() != null ? p.getDesignation().getId() : null);
        map.put("grade", p.getGrade() != null ? p.getGrade().getId() : null);
        map.put("reporting_manager", p.getReportingManager() != null ? p.getReportingManager().getId() : null);
        map.put("joining_date", p.getJoiningDate() != null ? p.getJoiningDate().toString() : null);
        map.put("employment_type", p.getEmploymentType());
        map.put("status", p.getStatus());
        map.put("gender", p.getGender());
        map.put("date_of_birth", p.getDateOfBirth() != null ? p.getDateOfBirth().toString() : null);
        map.put("contact_number", p.getContactNumber());
        map.put("personal_email", p.getPersonalEmail());
        map.put("emergency_contact", p.getEmergencyContact());
        map.put("emergency_phone", p.getEmergencyPhone());
        map.put("office_location", p.getOfficeLocation());
        map.put("work_phone", p.getWorkPhone());
        map.put("pan_number", p.getPanNumber());
        map.put("aadhar_number", p.getAadharNumber());
        map.put("passport_number", p.getPassportNumber());
        return map;
    }

    private Map<String, Object> getRoleMetadata(String role) {
        Map<String, Object> m = new HashMap<>();
        switch (role) {
            case "admin":
                m.put("title", "System Administrator");
                m.put("tier", "Tier-1 · Critical Security Access");
                m.put("classification", "CRITICAL");
                m.put("description", "Full platform governance with unrestricted access to all system configurations, security controls, and organizational data.");
                m.put("responsibilities", Arrays.asList(
                    "Full platform access & governance",
                    "User account lifecycle management",
                    "Security protocol configuration",
                    "Audit log monitoring & analysis",
                    "System-wide settings control",
                    "Role & privilege assignment"
                ));
                m.put("capabilities", Arrays.asList(
                    "Create/modify/delete any user account",
                    "Access all modules without restriction",
                    "Configure system-level settings",
                    "View complete audit trail",
                    "Manage security certificates",
                    "Override any access control"
                ));
                return m;
            case "hr":
                m.put("title", "HR Manager");
                m.put("tier", "Tier-2 · HR Operational Access");
                m.put("classification", "RESTRICTED");
                m.put("description", "End-to-end employee lifecycle management including onboarding, department assignments, leave governance, and workforce analytics.");
                m.put("responsibilities", Arrays.asList(
                    "Employee onboarding & offboarding",
                    "Department & designation management",
                    "Leave policy configuration",
                    "Workforce analytics & reporting",
                    "Attendance oversight",
                    "Recruitment pipeline supervision"
                ));
                m.put("capabilities", Arrays.asList(
                    "Create Employee / Manager / Recruiter accounts",
                    "Assign and transfer departments",
                    "Approve special leave requests",
                    "View all employee records",
                    "Generate workforce reports",
                    "Access recruitment data"
                ));
                return m;
            case "manager":
                m.put("title", "Department Manager");
                m.put("tier", "Tier-2 · Team Lead Access");
                m.put("classification", "INTERNAL");
                m.put("description", "Operational team supervision with authority over attendance, leave approvals, performance reviews, and direct report management.");
                m.put("responsibilities", Arrays.asList(
                    "Direct team supervision",
                    "Leave request approvals",
                    "Attendance monitoring",
                    "Performance review submissions",
                    "Goal sheet evaluations",
                    "Appraisal rating approvals"
                ));
                m.put("capabilities", Arrays.asList(
                    "View team employee profiles",
                    "Approve or reject leave requests",
                    "Monitor team attendance records",
                    "Submit appraisal reviews",
                    "Recommend promotions",
                    "Access team productivity reports"
                ));
                return m;
            case "recruiter":
                m.put("title", "Recruiter");
                m.put("tier", "Tier-3 · Talent Acquisition Access");
                m.put("classification", "INTERNAL");
                m.put("description", "End-to-end candidate pipeline management covering job requisitions, sourcing, interview scheduling, and offer letter generation.");
                m.put("responsibilities", Arrays.asList(
                    "Job requisition management",
                    "Candidate sourcing & tracking",
                    "Interview round scheduling",
                    "Offer letter generation",
                    "Hiring pipeline reporting"
                ));
                m.put("capabilities", Arrays.asList(
                    "Create and manage job postings",
                    "View and update candidate records",
                    "Schedule interview rounds",
                    "Generate offer letters",
                    "Access recruitment analytics"
                ));
                return m;
            case "payroll":
                m.put("title", "Payroll Executive");
                m.put("tier", "Tier-3 · Compensation Gatekeeper");
                m.put("classification", "CONFIDENTIAL");
                m.put("description", "Salary computation, payslip generation, deduction management, and payroll compliance in line with financial regulatory requirements.");
                m.put("responsibilities", Arrays.asList(
                    "Monthly payroll processing",
                    "Payslip generation & distribution",
                    "Deduction rules management",
                    "Salary structure configuration",
                    "Tax computation oversight",
                    "Payroll compliance reporting"
                ));
                m.put("capabilities", Arrays.asList(
                    "Process and approve payroll runs",
                    "Generate employee payslips",
                    "Configure salary structures",
                    "Manage deductions & bonuses",
                    "View compensation reports",
                    "Access employee salary data"
                ));
                return m;
            case "employee":
                m.put("title", "Employee");
                m.put("tier", "Tier-4 · Self-Service Access");
                m.put("classification", "PUBLIC");
                m.put("description", "Standard corporate self-service access for personal profile management, attendance tracking, leave applications, and payslip downloads.");
                m.put("responsibilities", Arrays.asList(
                    "Personal profile maintenance",
                    "Daily attendance check-in/out",
                    "Leave application submission",
                    "Goal sheet self-assessment",
                    "Payslip download access",
                    "Appraisal self-review"
                ));
                m.put("capabilities", Arrays.asList(
                    "View and update own profile",
                    "Submit leave requests",
                    "Clock in/out for attendance",
                    "Download own payslips",
                    "Access own appraisal data",
                    "View own notifications"
                ));
                return m;
            default:
                return null;
        }
    }
}

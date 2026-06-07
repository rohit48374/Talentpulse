package com.talentpulse.hrms.controller;

import com.talentpulse.hrms.model.*;
import com.talentpulse.hrms.repository.*;
import com.talentpulse.hrms.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private LeaveTypeRepository leaveTypeRepository;

    @Autowired
    private LeaveBalanceRepository leaveBalanceRepository;

    @Autowired
    private LeaveApplicationRepository leaveApplicationRepository;

    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;

    @Autowired
    private CheckInOutRepository checkInOutRepository;

    @Autowired
    private UserService userService;

    // --- LEAVE TYPES ---

    @GetMapping("/leave-types/")
    public ResponseEntity<?> listLeaveTypes() {
        return ResponseEntity.ok(leaveTypeRepository.findAll());
    }

    // --- LEAVE BALANCES ---

    @GetMapping("/leave-balances/")
    public ResponseEntity<?> listLeaveBalances(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<LeaveBalance> balances = leaveBalanceRepository.findByEmployeeId(userOpt.get().getId());
        List<Map<String, Object>> results = balances.stream().map(b -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", b.getId());
            map.put("leave_type", b.getLeaveType().getId());
            map.put("leave_type_name", b.getLeaveType().getName());
            map.put("financial_year", b.getFinancialYear());
            map.put("total_days", b.getTotalDays());
            map.put("used_days", b.getUsedDays());
            map.put("pending_days", b.getPendingDays());
            map.put("available_days", b.getAvailableDays());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }

    // --- LEAVE APPLICATIONS ---

    @GetMapping("/leave-applications/")
    public ResponseEntity<?> listLeaveApplications(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        List<LeaveApplication> apps;
        if (user.isHrStaff()) {
            apps = leaveApplicationRepository.findAll();
        } else {
            apps = leaveApplicationRepository.findByEmployeeId(user.getId());
        }

        List<Map<String, Object>> results = apps.stream().map(a -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("leave_type", a.getLeaveType().getId());
            map.put("leave_type_name", a.getLeaveType().getName());
            map.put("start_date", a.getStartDate().toString());
            map.put("end_date", a.getEndDate().toString());
            map.put("days_requested", a.getDaysRequested());
            map.put("reason", a.getReason());
            map.put("status", a.getStatus());
            map.put("approved_by", a.getApprovedBy() != null ? a.getApprovedBy().getFullName() : null);
            map.put("employee_name", a.getEmployee().getFullName());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }

    @PostMapping("/leave-applications/")
    public ResponseEntity<?> applyLeave(@RequestBody Map<String, Object> request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Long leaveTypeId = ((Number) request.get("leave_type")).longValue();
        Optional<LeaveType> ltOpt = leaveTypeRepository.findById(leaveTypeId);
        if (ltOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Leave type not found"));
        }

        LocalDate start = LocalDate.parse((String) request.get("start_date"));
        LocalDate end = LocalDate.parse((String) request.get("end_date"));

        LeaveApplication app = LeaveApplication.builder()
                .employee(userOpt.get())
                .leaveType(ltOpt.get())
                .startDate(start)
                .endDate(end)
                .reason((String) request.get("reason"))
                .status("pending")
                .build();

        leaveApplicationRepository.save(app);

        // Update leave balance pending days
        String finYear = "2026-2027"; // Mock financial year
        Optional<LeaveBalance> balOpt = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndFinancialYear(
                userOpt.get().getId(), ltOpt.get().getId(), finYear);

        if (balOpt.isPresent()) {
            LeaveBalance bal = balOpt.get();
            bal.setPendingDays(bal.getPendingDays() + app.getNumberOfDays());
            leaveBalanceRepository.save(bal);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(app);
    }

    @PutMapping("/leave-applications/{id}/")
    public ResponseEntity<?> updateLeaveApplication(@PathVariable("id") Long id, @RequestBody Map<String, Object> request, Principal principal) {
        Optional<LeaveApplication> appOpt = leaveApplicationRepository.findById(id);
        if (appOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        LeaveApplication app = appOpt.get();
        String oldStatus = app.getStatus();
        String status = (String) request.get("status");
        app.setStatus(status);

        if (principal != null) {
            userService.findByUsername(principal.getName()).ifPresent(user -> {
                app.setApprovedBy(user);
                app.setApprovalDate(LocalDateTime.now());
            });
        }
        if (request.containsKey("approval_remarks")) {
            app.setApprovalRemarks((String) request.get("approval_remarks"));
        }

        leaveApplicationRepository.save(app);

        // Update leave balances based on state transition
        String finYear = "2026-2027";
        Optional<LeaveBalance> balOpt = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndFinancialYear(
                app.getEmployee().getId(), app.getLeaveType().getId(), finYear);

        if (balOpt.isPresent() && !status.equalsIgnoreCase(oldStatus)) {
            LeaveBalance bal = balOpt.get();
            int days = app.getNumberOfDays();
            
            // 1. Revert previous status changes
            if ("pending".equalsIgnoreCase(oldStatus)) {
                bal.setPendingDays(Math.max(0, bal.getPendingDays() - days));
            } else if ("approved".equalsIgnoreCase(oldStatus)) {
                bal.setUsedDays(Math.max(0, bal.getUsedDays() - days));
            }
            
            // 2. Apply new status changes
            if ("pending".equalsIgnoreCase(status)) {
                bal.setPendingDays(bal.getPendingDays() + days);
            } else if ("approved".equalsIgnoreCase(status)) {
                bal.setUsedDays(bal.getUsedDays() + days);
            }
            
            leaveBalanceRepository.save(bal);
        }

        return ResponseEntity.ok(app);
    }

    // --- ATTENDANCE ---

    @GetMapping("/attendance/")
    public ResponseEntity<?> listAttendance(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        List<AttendanceRecord> records;
        if (user.isHrStaff()) {
            records = attendanceRecordRepository.findAll();
        } else {
            records = attendanceRecordRepository.findByEmployeeIdAndDateBetween(
                    user.getId(), LocalDate.now().minusDays(30), LocalDate.now());
        }
        return ResponseEntity.ok(records);
    }

    @PostMapping("/attendance/")
    public ResponseEntity<?> recordAttendance(@RequestBody Map<String, Object> request) {
        Long empId = ((Number) request.get("employee")).longValue();
        Optional<User> userOpt = userService.findById(empId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Employee not found"));
        }

        LocalDate date = LocalDate.parse((String) request.get("date"));
        String status = (String) request.get("status");

        AttendanceRecord record = attendanceRecordRepository.findByEmployeeIdAndDate(empId, date)
                .orElseGet(() -> AttendanceRecord.builder().employee(userOpt.get()).date(date).build());

        record.setStatus(status);
        if (request.get("check_in_time") != null) {
            record.setCheckInTime(LocalTime.parse((String) request.get("check_in_time")));
        }
        if (request.get("check_out_time") != null) {
            record.setCheckOutTime(LocalTime.parse((String) request.get("check_out_time")));
        }
        if (request.get("working_hours") != null) {
            record.setWorkingHours(new BigDecimal(request.get("working_hours").toString()));
        }

        attendanceRecordRepository.save(record);
        return ResponseEntity.ok(record);
    }

    // --- CHECK IN OUT ---

    @PostMapping("/check-in-out/check_in/")
    public ResponseEntity<?> checkIn(@RequestBody Map<String, Object> request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        CheckInOut check = CheckInOut.builder()
                .employee(user)
                .checkType("check_in")
                .location((String) request.get("location"))
                .latitude(request.get("latitude") != null ? ((Number) request.get("latitude")).doubleValue() : null)
                .longitude(request.get("longitude") != null ? ((Number) request.get("longitude")).doubleValue() : null)
                .deviceInfo((String) request.get("device_info"))
                .build();

        checkInOutRepository.save(check);

        // Update or create attendance record for today
        LocalDate today = LocalDate.now();
        AttendanceRecord record = attendanceRecordRepository.findByEmployeeIdAndDate(user.getId(), today)
                .orElseGet(() -> AttendanceRecord.builder().employee(user).date(today).build());

        record.setStatus("present");
        record.setCheckInTime(LocalTime.now());
        attendanceRecordRepository.save(record);

        return ResponseEntity.status(HttpStatus.CREATED).body(check);
    }

    @PostMapping("/check-in-out/check_out/")
    public ResponseEntity<?> checkOut(@RequestBody Map<String, Object> request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        CheckInOut check = CheckInOut.builder()
                .employee(user)
                .checkType("check_out")
                .location((String) request.get("location"))
                .latitude(request.get("latitude") != null ? ((Number) request.get("latitude")).doubleValue() : null)
                .longitude(request.get("longitude") != null ? ((Number) request.get("longitude")).doubleValue() : null)
                .deviceInfo((String) request.get("device_info"))
                .build();

        checkInOutRepository.save(check);

        // Update attendance record check out time and calculate working hours
        LocalDate today = LocalDate.now();
        Optional<AttendanceRecord> recordOpt = attendanceRecordRepository.findByEmployeeIdAndDate(user.getId(), today);
        if (recordOpt.isPresent()) {
            AttendanceRecord record = recordOpt.get();
            record.setCheckOutTime(LocalTime.now());
            if (record.getCheckInTime() != null) {
                long minutes = ChronoUnit.MINUTES.between(record.getCheckInTime(), record.getCheckOutTime());
                BigDecimal hours = BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 2, BigDecimal.ROUND_HALF_UP);
                record.setWorkingHours(hours);
            }
            attendanceRecordRepository.save(record);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(check);
    }
}

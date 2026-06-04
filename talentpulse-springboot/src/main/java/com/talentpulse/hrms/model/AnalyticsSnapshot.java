package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "analytics_snapshots")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "snapshot_date", unique = true, nullable = false)
    private LocalDate snapshotDate;

    // Headcount
    @Column(name = "total_employees", nullable = false)
    private Integer totalEmployees;

    @Column(name = "active_employees", nullable = false)
    private Integer activeEmployees;

    @Column(name = "on_leave_employees", nullable = false)
    private Integer onLeaveEmployees;

    // Attrition
    @Column(name = "exited_employees_ytd", nullable = false)
    private Integer exitedEmployeesYtd;

    @Column(name = "attrition_rate", nullable = false)
    private BigDecimal attritionRate;

    // Recruitment
    @Column(name = "open_positions", nullable = false)
    private Integer openPositions;

    @Column(name = "applications_pending", nullable = false)
    private Integer applicationsPending;

    @Column(name = "offers_pending", nullable = false)
    private Integer offersPending;

    // Payroll
    @Column(name = "total_payroll_amount", nullable = false)
    private BigDecimal totalPayrollAmount;

    @Column(name = "processed_payrolls", nullable = false)
    private Integer processedPayrolls;

    @Column(name = "pending_payrolls", nullable = false)
    private Integer pendingPayrolls;

    // Attendance
    @Column(name = "average_attendance_rate", nullable = false)
    private BigDecimal averageAttendanceRate;

    @Column(name = "absent_today", nullable = false)
    private Integer absentToday;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

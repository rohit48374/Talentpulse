package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payslips", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"payroll_run_id", "employee_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payslip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_run_id", nullable = false)
    private PayrollRun payrollRun;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @Column(name = "base_salary", nullable = false)
    private BigDecimal baseSalary;

    @Column(nullable = false)
    private BigDecimal hra;

    @Column(nullable = false)
    private BigDecimal da;

    @Column(name = "other_allowances")
    private BigDecimal otherAllowances = BigDecimal.ZERO;

    private BigDecimal bonus = BigDecimal.ZERO;

    @Column(name = "gross_salary", nullable = false)
    private BigDecimal grossSalary;

    @Column(name = "pf_contribution", nullable = false)
    private BigDecimal pfContribution;

    @Column(nullable = false)
    private BigDecimal it;

    @Column(name = "other_deductions")
    private BigDecimal otherDeductions = BigDecimal.ZERO;

    @Column(name = "total_deductions", nullable = false)
    private BigDecimal totalDeductions;

    @Column(name = "net_salary", nullable = false)
    private BigDecimal netSalary;

    @Column(name = "days_worked")
    private Integer daysWorked = 0;

    @Column(name = "days_leave")
    private Integer daysLeave = 0;

    private String status = "draft"; // draft, generated, approved, disbursed, issued

    // Compliance fields mapped from Python model
    @Column(name = "gross_amount")
    private BigDecimal grossAmount = BigDecimal.ZERO;

    @Column(name = "total_deductions_field")
    private BigDecimal totalDeductionsField = BigDecimal.ZERO;

    @Column(name = "net_amount")
    private BigDecimal netAmount = BigDecimal.ZERO;

    @Column(name = "payslip_date")
    private LocalDate payslipDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        grossAmount = grossSalary;
        totalDeductionsField = totalDeductions;
        netAmount = netSalary;
        if (payslipDate == null) {
            payslipDate = LocalDate.now();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }
}

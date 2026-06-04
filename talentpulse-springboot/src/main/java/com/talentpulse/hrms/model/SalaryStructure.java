package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "salary_structures")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryStructure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grade_id")
    private GradeStructure grade;

    @Column(name = "base_salary", nullable = false)
    private BigDecimal baseSalary;

    @Column(name = "basic_percent")
    private BigDecimal basicPercent = new BigDecimal("50.00");

    @Column(name = "hra_percent")
    private BigDecimal hraPercent = new BigDecimal("20.00");

    private BigDecimal hra = BigDecimal.ZERO; // House Rent Allowance
    private BigDecimal da = BigDecimal.ZERO;  // Dearness Allowance

    @Column(name = "other_allowances")
    private BigDecimal otherAllowances = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String allowances; // JSON String or description

    @Column(name = "pf_contribution")
    private BigDecimal pfContribution = BigDecimal.ZERO;

    private BigDecimal it = BigDecimal.ZERO; // Income Tax

    @Column(name = "other_deductions")
    private BigDecimal otherDeductions = BigDecimal.ZERO;

    @Column(name = "deduction_rules", columnDefinition = "TEXT")
    private String deductionRules; // JSON String

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

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

    public BigDecimal getGrossSalary() {
        return baseSalary.add(hra).add(da).add(otherAllowances);
    }

    public BigDecimal getTotalDeductions() {
        return pfContribution.add(it).add(otherDeductions);
    }

    public BigDecimal getNetSalary() {
        return getGrossSalary().subtract(getTotalDeductions());
    }
}

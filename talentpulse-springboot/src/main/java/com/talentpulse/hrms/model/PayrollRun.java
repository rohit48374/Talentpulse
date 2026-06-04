package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payroll_runs", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"month_year"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "month_year", nullable = false)
    private String monthYear; // e.g. "2024-05"

    private String status = "draft"; // draft, processed, approved, disbursed, cancelled

    @Column(name = "total_employees", nullable = false)
    private Integer totalEmployees;

    @Column(name = "total_gross_salary")
    private BigDecimal totalGrossSalary = BigDecimal.ZERO;

    @Column(name = "total_deductions")
    private BigDecimal totalDeductions = BigDecimal.ZERO;

    @Column(name = "total_net_salary")
    private BigDecimal totalNetSalary = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    @Column(name = "approval_date")
    private LocalDateTime approvalDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Compliance fields mapped from Python model saving
    private Integer month;
    private Integer year;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by_id")
    private User processedBy;

    @Column(name = "processed_date")
    private LocalDate processedDate;

    @Column(name = "total_gross")
    private BigDecimal totalGross = BigDecimal.ZERO;

    @Column(name = "total_net")
    private BigDecimal totalNet = BigDecimal.ZERO;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        if (monthYear != null && (month == null || year == null)) {
            try {
                String[] parts = monthYear.split("-");
                year = Integer.parseInt(parts[0]);
                month = Integer.parseInt(parts[1]);
            } catch (Exception ignored) {}
        }
        if (processedBy == null) {
            processedBy = createdBy;
        }
        if (processedDate == null) {
            processedDate = LocalDate.now();
        }
        totalGross = totalGrossSalary;
        totalNet = totalNetSalary;

        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }
}

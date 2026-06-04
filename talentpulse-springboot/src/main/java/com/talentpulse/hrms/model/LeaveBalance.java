package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "leave_balances", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"employee_id", "leave_type_id", "financial_year"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leave_type_id", nullable = false)
    private LeaveType leaveType;

    @Column(name = "financial_year", nullable = false)
    private String financialYear; // e.g. "2024-2025"

    @Column(name = "total_days", nullable = false)
    private Integer totalDays;

    @Column(name = "used_days")
    private Integer usedDays = 0;

    @Column(name = "pending_days")
    private Integer pendingDays = 0;

    // Compliance fields mapped from Python property properties
    private Integer year;
    private Integer entitled;
    private Integer taken = 0;
    private Integer pending = 0;
    private Integer balance;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        if (financialYear != null && year == null) {
            try {
                String[] parts = financialYear.split("-");
                year = Integer.parseInt(parts[0]);
            } catch (Exception ignored) {}
        }
        entitled = totalDays;
        taken = usedDays;
        pending = pendingDays;
        balance = totalDays - usedDays;
    }

    public Integer getAvailableDays() {
        return totalDays - usedDays;
    }
}

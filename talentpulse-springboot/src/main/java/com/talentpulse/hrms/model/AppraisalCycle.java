package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "appraisal_cycles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppraisalCycle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    private String status = "planning"; // planning, active, completed, archived, upcoming, closed

    @Column(name = "financial_year", nullable = false)
    private String financialYear; // e.g. "2024-2025"

    // Compliance fields mapped from Python logic
    private Integer year;

    @Column(name = "cycle_type")
    private String cycleType = "annual"; // mid_year, annual

    @Column(name = "goal_setting_start")
    private LocalDate goalSettingStart;

    @Column(name = "goal_setting_end")
    private LocalDate goalSettingEnd;

    @Column(name = "review_start")
    private LocalDate reviewStart;

    @Column(name = "review_end")
    private LocalDate reviewEnd;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        if (financialYear != null && year == null) {
            try {
                String[] parts = financialYear.split("-");
                year = Integer.parseInt(parts[0]);
            } catch (Exception ignored) {}
        }
        if (startDate != null && reviewStart == null) {
            reviewStart = startDate;
        }
        if (endDate != null && reviewEnd == null) {
            reviewEnd = endDate;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }
}

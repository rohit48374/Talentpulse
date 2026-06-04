package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "promotion_recommendations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appraisal_cycle_id", nullable = false)
    private AppraisalCycle appraisalCycle;

    @Column(name = "current_designation", nullable = false)
    private String currentDesignation;

    @Column(name = "recommended_designation", nullable = false)
    private String recommendedDesignation;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String reason;

    private String status = "recommended"; // recommended, approved, rejected, implemented, declined

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    // Compliance fields mapped from Python logic
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_grade_id")
    private GradeStructure currentGrade;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommended_grade_id")
    private GradeStructure recommendedGrade;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommended_by_id")
    private User recommendedBy;

    @Column(name = "salary_increment_percentage")
    private BigDecimal salaryIncrementPercentage = BigDecimal.ZERO;

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        if (recommendedBy == null) {
            recommendedBy = approvedBy;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }
}

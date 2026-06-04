package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "employee_appraisals", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"appraisal_cycle_id", "employee_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeAppraisal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appraisal_cycle_id", nullable = false)
    private AppraisalCycle appraisalCycle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    private String status = "draft"; // draft, self_review, manager_review, final, completed

    // Self assessment
    @Column(name = "self_rating")
    private Integer selfRating;

    @Column(name = "self_comments", columnDefinition = "TEXT")
    private String selfComments;

    // Manager assessment
    @Column(name = "manager_rating")
    private Integer managerRating;

    @Column(name = "manager_comments", columnDefinition = "TEXT")
    private String managerComments;

    // Final rating
    @Column(name = "final_rating")
    private Integer finalRating;

    @Column(name = "performance_remarks", columnDefinition = "TEXT")
    private String performanceRemarks;

    // Development plan
    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Column(name = "areas_for_improvement", columnDefinition = "TEXT")
    private String areasForImprovement;

    @Column(name = "development_plan", columnDefinition = "TEXT")
    private String developmentPlan;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

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

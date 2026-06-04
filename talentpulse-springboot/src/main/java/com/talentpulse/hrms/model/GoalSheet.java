package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "goal_sheets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalSheet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appraisal_cycle_id", nullable = false)
    private AppraisalCycle appraisalCycle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @Column(name = "goal_title")
    private String goalTitle;

    @Column(name = "goal_description", columnDefinition = "TEXT")
    private String goalDescription;

    @Column(name = "target_value")
    private String targetValue;

    private Integer weight = 10; // weight in %

    private String status = "draft"; // draft, submitted, approved, in_progress, completed, reviewed, finalised

    @Column(name = "manager_comments", columnDefinition = "TEXT")
    private String managerComments;

    @Column(name = "actual_value")
    private String actualValue;

    @Column(name = "achievement_percentage")
    private Integer achievementPercentage;

    // Compliance fields mapped from Python logic
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    @Column(name = "goals_json", columnDefinition = "TEXT")
    private String goalsJson; // List JSON string

    @Column(name = "self_rating")
    private Integer selfRating;

    @Column(name = "manager_rating")
    private Integer managerRating;

    @Column(name = "final_rating")
    private Integer finalRating;

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

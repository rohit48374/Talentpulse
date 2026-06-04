package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_rounds")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewRound {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requisition_id")
    private JobRequisition requisition;

    @Column(name = "interview_type", nullable = false)
    private String interviewType; // phone, technical, hr, manager, final

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interviewer_id")
    private User interviewer;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDateTime scheduledDate;

    private String status = "scheduled"; // scheduled, completed, postponed, cancelled

    private String outcome = "pending"; // pass, fail, hold, pending

    @Column(columnDefinition = "TEXT")
    private String feedback;

    private Integer rating; // 1 to 5

    @Column(name = "meeting_link")
    private String meetingLink;

    @Column(name = "communication_rating")
    private Integer communicationRating;

    @Column(name = "confidence_rating")
    private Integer confidenceRating;

    @Column(name = "professionalism_rating")
    private Integer professionalismRating;

    @Column(name = "cultural_fit_rating")
    private Integer culturalFitRating;

    @Column(name = "problem_solving_rating")
    private Integer problemSolvingRating;

    @Column(name = "tech_knowledge_rating")
    private Integer techKnowledgeRating;

    @Column(name = "coding_rating")
    private Integer codingRating;

    @Column(name = "project_experience_rating")
    private Integer projectExperienceRating;

    @Column(name = "system_design_rating")
    private Integer systemDesignRating;

    @Column(name = "is_candidate_live")
    private boolean isCandidateLive = false;

    @Column(name = "is_interviewer_live")
    private boolean isInterviewerLive = false;

    @Column(name = "candidate_last_seen")
    private LocalDateTime candidateLastSeen;

    @Column(name = "interviewer_last_seen")
    private LocalDateTime interviewerLastSeen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

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

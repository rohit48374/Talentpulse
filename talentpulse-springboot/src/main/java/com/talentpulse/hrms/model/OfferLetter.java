package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "offer_letters")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfferLetter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requisition_id")
    private JobRequisition requisition;

    @Column(name = "position_title", nullable = false)
    private String positionTitle;

    @Column(nullable = false)
    private BigDecimal salary;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Column(name = "issued_date")
    private LocalDate issuedDate;

    @Column(name = "offer_validity", nullable = false)
    private LocalDate offerValidity;

    @Column(name = "document_path")
    private String document;

    private String status = "draft"; // issued, accepted, declined, revoked, draft

    @Column(name = "created_date", updatable = false)
    private LocalDateTime createdDate;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdDate = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

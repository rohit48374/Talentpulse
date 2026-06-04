package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "hr_reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HRReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String scope; // department, grade, period, cost_centre

    @Column(columnDefinition = "TEXT")
    private String metrics; // JSON string

    @Column(name = "generated_date", updatable = false)
    private LocalDateTime generatedDate;

    @PrePersist
    protected void onCreate() {
        generatedDate = LocalDateTime.now();
    }
}

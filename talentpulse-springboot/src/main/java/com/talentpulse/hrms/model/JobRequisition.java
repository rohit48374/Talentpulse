package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_requisitions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobRequisition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    private String department;
    private String designation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_ref_id")
    private Department departmentRef;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "designation_ref_id")
    private Designation designationRef;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grade_id")
    private GradeStructure grade;

    @Column(name = "position_count")
    private Integer positionCount = 1;

    @Column(name = "salary_range_min")
    private BigDecimal salaryRangeMin;

    @Column(name = "salary_range_max")
    private BigDecimal salaryRangeMax;

    @Column(name = "required_by")
    private LocalDate requiredBy;

    private String status = "draft"; // draft, approved, open, filled, cancelled

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

package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "department_analytics", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"department_name", "snapshot_date"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "department_name", nullable = false)
    private String departmentName;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Column(name = "employee_count", nullable = false)
    private Integer employeeCount;

    @Column(name = "average_salary", nullable = false)
    private BigDecimal averageSalary;

    @Column(name = "attrition_rate", nullable = false)
    private BigDecimal attritionRate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

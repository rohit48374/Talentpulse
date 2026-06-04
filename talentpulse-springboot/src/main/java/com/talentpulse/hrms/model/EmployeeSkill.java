package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "employee_skills", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"employee_id", "skill_name"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private EmployeeProfile employee;

    @Column(name = "skill_name", nullable = false)
    private String skillName;

    @Column(nullable = false)
    private String proficiency; // beginner, intermediate, advanced, expert

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;
}

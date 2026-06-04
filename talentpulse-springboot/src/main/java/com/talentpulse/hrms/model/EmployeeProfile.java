package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "employee_profiles", indexes = {
        @Index(name = "idx_emp_profiles_dept", columnList = "department_id"),
        @Index(name = "idx_emp_profiles_desig", columnList = "designation_id"),
        @Index(name = "idx_emp_profiles_manager", columnList = "reporting_manager_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "designation_id")
    private Designation designation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grade_id")
    private GradeStructure grade;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporting_manager_id")
    private User reportingManager;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Column(name = "employment_type")
    private String employmentType = "permanent"; // permanent, contract, intern

    private String status = "active"; // active, probation, resigned, exited

    private String gender; // M, F, O

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "contact_number")
    private String contactNumber;

    @Column(name = "personal_email")
    private String personalEmail;

    @Column(name = "emergency_contact")
    private String emergencyContact;

    @Column(name = "emergency_phone")
    private String emergencyPhone;

    @Column(name = "office_location")
    private String officeLocation;

    @Column(name = "work_phone")
    private String workPhone;

    @Column(name = "pan_number", unique = true)
    private String panNumber;

    @Column(name = "aadhar_number", unique = true)
    private String aadharNumber;

    @Column(name = "passport_number", unique = true)
    private String passportNumber;

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

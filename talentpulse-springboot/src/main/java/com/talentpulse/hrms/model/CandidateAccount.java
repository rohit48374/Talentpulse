package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "candidate_accounts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password; // Hashed password

    @Column(name = "full_name", nullable = false)
    private String fullName;

    private String phone;
    private String location;
    private String experience;

    @Column(columnDefinition = "TEXT")
    private String skills;

    private String qualification;

    @Column(name = "resume_path")
    private String resume;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "portfolio_url")
    private String portfolioUrl;

    @Column(name = "education_details", columnDefinition = "TEXT")
    private String educationDetails;

    private Integer backlogs = 0;
    private String college;
    private BigDecimal cgpa;

    @Column(name = "tenth_percentage")
    private BigDecimal tenthPercentage;

    @Column(name = "inter_percentage")
    private BigDecimal interPercentage;

    @Column(name = "preferred_locations")
    private String preferredLocations;

    @Column(name = "alternate_phone")
    private String alternatePhone;

    private LocalDate dob;
    private String gender;

    @Column(name = "current_company")
    private String currentCompany;

    @Column(name = "current_role")
    private String currentRole;

    @Column(name = "current_ctc")
    private BigDecimal currentCtc;

    @Column(name = "expected_ctc")
    private BigDecimal expectedCtc;

    @Column(name = "notice_period")
    private String noticePeriod;

    @Column(columnDefinition = "TEXT")
    private String certifications;

    @Column(name = "tenth_school")
    private String tenthSchool;

    @Column(name = "tenth_board")
    private String tenthBoard;

    @Column(name = "tenth_year")
    private Integer tenthYear;

    @Column(name = "inter_college")
    private String interCollege;

    @Column(name = "inter_board")
    private String interBoard;

    @Column(name = "inter_year")
    private Integer interYear;

    @Column(name = "diploma_institution")
    private String diplomaInstitution;

    @Column(name = "diploma_percentage")
    private BigDecimal diplomaPercentage;

    @Column(name = "diploma_year")
    private Integer diplomaYear;

    @Column(name = "grad_degree")
    private String gradDegree;

    @Column(name = "grad_specialization")
    private String gradSpecialization;

    @Column(name = "grad_year")
    private Integer gradYear;

    @Column(name = "pg_university")
    private String pgUniversity;

    @Column(name = "pg_degree")
    private String pgDegree;

    @Column(name = "pg_cgpa")
    private BigDecimal pgCgpa;

    @Column(name = "pg_year")
    private Integer pgYear;

    @Column(name = "active_backlogs")
    private Integer activeBacklogs = 0;

    @Column(name = "cleared_backlogs")
    private Integer clearedBacklogs = 0;

    @Column(name = "grad_percentage")
    private BigDecimal gradPercentage;

    @Column(name = "github_profile")
    private String githubProfile;

    @Column(name = "willing_to_relocate")
    private boolean willingToRelocate = false;

    @Column(name = "is_verified")
    private boolean isVerified = false;

    @Column(name = "verification_token")
    private String verificationToken;

    @Column(name = "otp_code")
    private String otpCode;

    @Column(name = "otp_created_at")
    private LocalDateTime otpCreatedAt;

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

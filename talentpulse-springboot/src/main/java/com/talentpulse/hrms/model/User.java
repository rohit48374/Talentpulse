package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_email", columnList = "email"),
        @Index(name = "idx_users_employee_id", columnList = "employee_id"),
        @Index(name = "idx_users_role", columnList = "role"),
        @Index(name = "idx_users_status", columnList = "status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "employee_id", unique = true)
    private String employeeId;

    @Column(name = "full_name")
    private String fullName;

    private String phone;

    private String role; // employee, manager, hr, recruiter, payroll, admin

    private String department;

    private String designation;

    @Column(name = "profile_image")
    private String profileImage;

    private String address;

    private BigDecimal salary;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    private String status; // active, on_leave, inactive, exited

    @Column(name = "reset_token")
    private String resetToken;

    @Column(name = "reset_token_expires_at")
    private LocalDateTime resetTokenExpiresAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_active")
    private boolean isActive = true;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = "active";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean isHrStaff() {
        return "hr".equalsIgnoreCase(role) || "admin".equalsIgnoreCase(role);
    }

    public boolean isManager() {
        return "manager".equalsIgnoreCase(role) || "hr".equalsIgnoreCase(role) || "admin".equalsIgnoreCase(role);
    }

    public boolean isRecruiter() {
        return "recruiter".equalsIgnoreCase(role) || "admin".equalsIgnoreCase(role);
    }
}

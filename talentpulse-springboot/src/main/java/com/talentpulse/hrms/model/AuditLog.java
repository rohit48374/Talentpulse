package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_logs_user_timestamp", columnList = "user_id, timestamp"),
        @Index(name = "idx_audit_logs_action_timestamp", columnList = "action, timestamp"),
        @Index(name = "idx_audit_logs_model_name", columnList = "model_name")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String action; // create, update, delete, login, logout, approve, reject

    @Column(name = "model_name")
    private String modelName;

    @Column(name = "object_id")
    private Long objectId;

    @Column(columnDefinition = "TEXT")
    private String changes; // JSON string

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(updatable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}

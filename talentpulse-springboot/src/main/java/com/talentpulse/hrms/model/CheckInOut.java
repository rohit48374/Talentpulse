package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "check_in_outs", indexes = {
        @Index(name = "idx_check_in_outs_emp_time", columnList = "employee_id, timestamp")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckInOut {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @Column(name = "check_type", nullable = false)
    private String checkType; // check_in, check_out

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    private String location;
    private Double latitude;
    private Double longitude;

    @Column(name = "device_info")
    private String deviceInfo;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}

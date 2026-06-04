package com.talentpulse.hrms.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "dashboard_cards")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(name = "card_type", nullable = false)
    private String cardType; // metric, chart, list, summary

    @Column(name = "applicable_role", nullable = false)
    private String applicableRole; // employee, manager, hr, recruiter, payroll, admin

    @Column(columnDefinition = "TEXT")
    private String description;

    private String icon;

    private Integer position = 0;

    @Column(name = "is_active")
    private boolean isActive = true;
}

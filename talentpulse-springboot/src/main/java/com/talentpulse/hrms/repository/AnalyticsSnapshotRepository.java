package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.AnalyticsSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface AnalyticsSnapshotRepository extends JpaRepository<AnalyticsSnapshot, Long> {
    Optional<AnalyticsSnapshot> findBySnapshotDate(LocalDate snapshotDate);
    Optional<AnalyticsSnapshot> findTopByOrderBySnapshotDateDesc();
}

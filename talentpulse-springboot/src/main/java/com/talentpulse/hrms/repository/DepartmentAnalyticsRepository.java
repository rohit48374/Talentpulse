package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.DepartmentAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentAnalyticsRepository extends JpaRepository<DepartmentAnalytics, Long> {
    List<DepartmentAnalytics> findByDepartmentName(String departmentName);
    Optional<DepartmentAnalytics> findByDepartmentNameAndSnapshotDate(String departmentName, LocalDate snapshotDate);
}

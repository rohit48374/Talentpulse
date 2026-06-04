package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.EmployeeProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeProfileRepository extends JpaRepository<EmployeeProfile, Long>, JpaSpecificationExecutor<EmployeeProfile> {
    Optional<EmployeeProfile> findByUserId(Long userId);
    Optional<EmployeeProfile> findByUserUsername(String username);
    java.util.List<EmployeeProfile> findByReportingManagerId(Long managerId);
    java.util.List<EmployeeProfile> findByDepartmentId(Long departmentId);
}

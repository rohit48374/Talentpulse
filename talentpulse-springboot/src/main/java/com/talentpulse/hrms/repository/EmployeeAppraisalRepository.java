package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.EmployeeAppraisal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeAppraisalRepository extends JpaRepository<EmployeeAppraisal, Long>, JpaSpecificationExecutor<EmployeeAppraisal> {
    Optional<EmployeeAppraisal> findByAppraisalCycleIdAndEmployeeId(Long appraisalCycleId, Long employeeId);
    List<EmployeeAppraisal> findByEmployeeId(Long employeeId);
    List<EmployeeAppraisal> findByManagerId(Long managerId);
    long countByManagerIdAndStatus(Long managerId, String status);
}

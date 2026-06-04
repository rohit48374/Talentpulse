package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.GoalSheet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoalSheetRepository extends JpaRepository<GoalSheet, Long>, JpaSpecificationExecutor<GoalSheet> {
    List<GoalSheet> findByEmployeeIdAndAppraisalCycleId(Long employeeId, Long appraisalCycleId);
    List<GoalSheet> findByEmployeeId(Long employeeId);
}

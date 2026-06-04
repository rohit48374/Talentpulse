package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.EmployeeSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeSkillRepository extends JpaRepository<EmployeeSkill, Long> {
    List<EmployeeSkill> findByEmployeeId(Long employeeId);
    Optional<EmployeeSkill> findByEmployeeIdAndSkillName(Long employeeId, String skillName);
}

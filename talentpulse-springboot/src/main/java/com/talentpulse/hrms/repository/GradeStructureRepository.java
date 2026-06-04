package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.GradeStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GradeStructureRepository extends JpaRepository<GradeStructure, Long> {
    Optional<GradeStructure> findByGrade(String grade);
}

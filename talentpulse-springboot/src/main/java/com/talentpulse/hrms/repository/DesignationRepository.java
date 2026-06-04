package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.Designation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DesignationRepository extends JpaRepository<Designation, Long>, JpaSpecificationExecutor<Designation> {
    Optional<Designation> findByName(String name);
    List<Designation> findByDepartmentId(Long departmentId);
}

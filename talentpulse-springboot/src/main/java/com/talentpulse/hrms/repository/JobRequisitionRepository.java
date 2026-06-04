package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.JobRequisition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRequisitionRepository extends JpaRepository<JobRequisition, Long>, JpaSpecificationExecutor<JobRequisition> {
    List<JobRequisition> findByStatus(String status);
    long countByStatus(String status);
}

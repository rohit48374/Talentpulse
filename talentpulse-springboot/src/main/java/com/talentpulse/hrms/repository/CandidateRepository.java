package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Long>, JpaSpecificationExecutor<Candidate> {
    List<Candidate> findByCandidateAccountId(Long candidateAccountId);
    Optional<Candidate> findByJobRequisitionIdAndEmail(Long jobRequisitionId, String email);
    long countByStatus(String status);
}

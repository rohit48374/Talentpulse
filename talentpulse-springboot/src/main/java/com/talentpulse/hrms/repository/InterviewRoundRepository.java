package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.InterviewRound;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewRoundRepository extends JpaRepository<InterviewRound, Long>, JpaSpecificationExecutor<InterviewRound> {
    List<InterviewRound> findByCandidateCandidateAccountId(Long candidateAccountId);
    Optional<InterviewRound> findByIdAndCandidateCandidateAccountId(Long id, Long candidateAccountId);
    long countByStatusAndScheduledDateBetween(String status, java.time.LocalDateTime start, java.time.LocalDateTime end);
}

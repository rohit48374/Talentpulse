package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.OfferLetter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OfferLetterRepository extends JpaRepository<OfferLetter, Long>, JpaSpecificationExecutor<OfferLetter> {
    List<OfferLetter> findByCandidateCandidateAccountId(Long candidateAccountId);
    Optional<OfferLetter> findByIdAndCandidateCandidateAccountId(Long id, Long candidateAccountId);
    long countByStatus(String status);
}

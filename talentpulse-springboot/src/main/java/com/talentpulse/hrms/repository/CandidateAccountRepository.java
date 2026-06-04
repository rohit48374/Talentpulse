package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.CandidateAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CandidateAccountRepository extends JpaRepository<CandidateAccount, Long> {
    Optional<CandidateAccount> findByEmail(String email);
    Optional<CandidateAccount> findByEmailAndOtpCode(String email, String otpCode);
    Optional<CandidateAccount> findByEmailAndVerificationToken(String email, String verificationToken);
}

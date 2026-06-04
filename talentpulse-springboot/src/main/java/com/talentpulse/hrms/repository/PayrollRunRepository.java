package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.PayrollRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PayrollRunRepository extends JpaRepository<PayrollRun, Long> {
    Optional<PayrollRun> findByMonthYear(String monthYear);
    long countByStatus(String status);
}

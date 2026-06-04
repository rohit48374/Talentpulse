package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.HRReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HRReportRepository extends JpaRepository<HRReport, Long> {
}

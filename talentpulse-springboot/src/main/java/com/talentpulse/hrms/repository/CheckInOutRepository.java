package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.CheckInOut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CheckInOutRepository extends JpaRepository<CheckInOut, Long>, JpaSpecificationExecutor<CheckInOut> {
    List<CheckInOut> findByEmployeeIdOrderByTimestampDesc(Long employeeId);
}

package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {
    List<LeaveBalance> findByEmployeeId(Long employeeId);
    List<LeaveBalance> findByEmployeeIdAndFinancialYear(Long employeeId, String financialYear);
    Optional<LeaveBalance> findByEmployeeIdAndLeaveTypeIdAndFinancialYear(Long employeeId, Long leaveTypeId, String financialYear);
}

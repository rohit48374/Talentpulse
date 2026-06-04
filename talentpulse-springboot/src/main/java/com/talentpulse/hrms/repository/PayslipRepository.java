package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayslipRepository extends JpaRepository<Payslip, Long>, JpaSpecificationExecutor<Payslip> {
    Optional<Payslip> findByPayrollRunIdAndEmployeeId(Long payrollRunId, Long employeeId);
    List<Payslip> findByEmployeeId(Long employeeId);
    long countByStatus(String status);

    @org.springframework.data.jpa.repository.Query("SELECT SUM(p.netSalary) FROM Payslip p WHERE p.status IN :statuses")
    java.math.BigDecimal sumNetSalaryByStatusIn(@org.springframework.data.repository.query.Param("statuses") java.util.Collection<String> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT SUM(p.totalDeductions) FROM Payslip p WHERE p.status IN :statuses")
    java.math.BigDecimal sumTotalDeductionsByStatusIn(@org.springframework.data.repository.query.Param("statuses") java.util.Collection<String> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT SUM(p.netSalary) FROM Payslip p")
    java.math.BigDecimal sumAllNetSalary();

    @org.springframework.data.jpa.repository.Query("SELECT SUM(p.totalDeductions) FROM Payslip p")
    java.math.BigDecimal sumAllTotalDeductions();

    java.util.Optional<Payslip> findTopByEmployeeIdAndStatusOrderByIdDesc(Long employeeId, String status);
}

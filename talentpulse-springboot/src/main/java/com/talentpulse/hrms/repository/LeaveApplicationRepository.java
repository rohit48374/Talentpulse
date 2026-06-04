package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.LeaveApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveApplicationRepository extends JpaRepository<LeaveApplication, Long>, JpaSpecificationExecutor<LeaveApplication> {
    List<LeaveApplication> findByEmployeeId(Long employeeId);
    long countByEmployeeIdAndStatus(Long employeeId, String status);
    List<LeaveApplication> findByStatus(String status);
    
    @org.springframework.data.jpa.repository.Query("SELECT la FROM LeaveApplication la JOIN EmployeeProfile ep ON la.employee.id = ep.user.id WHERE ep.reportingManager.id = :managerId AND la.status = :status")
    List<LeaveApplication> findByReportingManagerIdAndStatus(@org.springframework.data.repository.query.Param("managerId") Long managerId, @org.springframework.data.repository.query.Param("status") String status);

    @org.springframework.data.jpa.repository.Query("SELECT la FROM LeaveApplication la JOIN EmployeeProfile ep ON la.employee.id = ep.user.id WHERE ep.reportingManager.id = :managerId AND la.status = 'approved' AND la.startDate <= :today AND la.endDate >= :today")
    List<LeaveApplication> findActiveLeavesByReportingManagerId(@org.springframework.data.repository.query.Param("managerId") Long managerId, @org.springframework.data.repository.query.Param("today") java.time.LocalDate today);
}

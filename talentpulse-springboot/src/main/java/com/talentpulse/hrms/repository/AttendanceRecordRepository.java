package com.talentpulse.hrms.repository;

import com.talentpulse.hrms.model.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long>, JpaSpecificationExecutor<AttendanceRecord> {
    Optional<AttendanceRecord> findByEmployeeIdAndDate(Long employeeId, LocalDate date);
    List<AttendanceRecord> findByEmployeeIdAndDateBetween(Long employeeId, LocalDate startDate, LocalDate endDate);
    List<AttendanceRecord> findByDate(LocalDate date);
    long countByEmployeeIdAndStatusAndDateBetween(Long employeeId, String status, LocalDate start, LocalDate end);
    long countByEmployeeIdAndStatusAndDate(Long employeeId, String status, LocalDate date);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(ar) FROM AttendanceRecord ar JOIN EmployeeProfile ep ON ar.employee.id = ep.user.id WHERE ep.reportingManager.id = :managerId AND ar.date = :date AND ar.status = 'present'")
    long countPresentTeamMembersByDate(@org.springframework.data.repository.query.Param("managerId") Long managerId, @org.springframework.data.repository.query.Param("date") LocalDate date);

    @org.springframework.data.jpa.repository.Query("SELECT ar FROM AttendanceRecord ar JOIN EmployeeProfile ep ON ar.employee.id = ep.user.id WHERE ep.reportingManager.id = :managerId")
    List<AttendanceRecord> findByReportingManagerId(@org.springframework.data.repository.query.Param("managerId") Long managerId);
}

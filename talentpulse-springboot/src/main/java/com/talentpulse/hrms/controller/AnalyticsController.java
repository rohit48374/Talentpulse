package com.talentpulse.hrms.controller;

import com.talentpulse.hrms.model.AnalyticsSnapshot;
import com.talentpulse.hrms.model.DepartmentAnalytics;
import com.talentpulse.hrms.repository.AnalyticsSnapshotRepository;
import com.talentpulse.hrms.repository.DepartmentAnalyticsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsSnapshotRepository analyticsSnapshotRepository;

    @Autowired
    private DepartmentAnalyticsRepository departmentAnalyticsRepository;

    @GetMapping("/snapshots/")
    public ResponseEntity<?> listSnapshots() {
        return ResponseEntity.ok(analyticsSnapshotRepository.findAll());
    }

    @GetMapping("/snapshots/latest/")
    public ResponseEntity<?> getLatestSnapshot() {
        Optional<AnalyticsSnapshot> snapOpt = analyticsSnapshotRepository.findTopByOrderBySnapshotDateDesc();
        if (snapOpt.isEmpty()) {
            // Return empty mock matching Django format if empty
            Map<String, Object> map = new HashMap<>();
            map.put("snapshot_date", LocalDate.now().toString());
            map.put("total_employees", 0);
            map.put("active_employees", 0);
            map.put("on_leave_employees", 0);
            map.put("attrition_rate", 0.0);
            map.put("open_positions", 0);
            map.put("average_attendance_rate", 0.0);
            return ResponseEntity.ok(map);
        }
        return ResponseEntity.ok(snapOpt.get());
    }

    @GetMapping("/department/")
    public ResponseEntity<?> getDepartmentAnalytics(@RequestParam(value = "department_name", required = false) String departmentName) {
        if (departmentName != null && !departmentName.trim().isEmpty()) {
            return ResponseEntity.ok(departmentAnalyticsRepository.findByDepartmentName(departmentName));
        }
        return ResponseEntity.ok(departmentAnalyticsRepository.findAll());
    }
}

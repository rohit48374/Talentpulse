package com.talentpulse.hrms.controller;

import com.talentpulse.hrms.model.*;
import com.talentpulse.hrms.repository.*;
import com.talentpulse.hrms.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/appraisal")
public class AppraisalController {

    @Autowired
    private AppraisalCycleRepository appraisalCycleRepository;

    @Autowired
    private GoalSheetRepository goalSheetRepository;

    @Autowired
    private EmployeeAppraisalRepository employeeAppraisalRepository;

    @Autowired
    private PromotionRecommendationRepository promotionRecommendationRepository;

    @Autowired
    private UserService userService;

    // --- APPRAISAL CYCLES ---

    @GetMapping("/cycles/")
    public ResponseEntity<?> listCycles() {
        return ResponseEntity.ok(appraisalCycleRepository.findAll());
    }

    @PostMapping("/cycles/")
    public ResponseEntity<?> createCycle(@RequestBody Map<String, Object> request, Principal principal) {
        AppraisalCycle cycle = AppraisalCycle.builder()
                .name((String) request.get("name"))
                .description((String) request.get("description"))
                .startDate(LocalDate.parse((String) request.get("start_date")))
                .endDate(LocalDate.parse((String) request.get("end_date")))
                .status((String) request.getOrDefault("status", "planning"))
                .financialYear((String) request.get("financial_year"))
                .build();

        if (principal != null) {
            userService.findByUsername(principal.getName()).ifPresent(cycle::setCreatedBy);
        }

        appraisalCycleRepository.save(cycle);
        return ResponseEntity.status(HttpStatus.CREATED).body(cycle);
    }

    // --- GOALS ---

    @GetMapping("/goals/")
    public ResponseEntity<?> listGoals(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        User user = userOpt.get();
        List<GoalSheet> list;
        if (user.isHrStaff()) {
            list = goalSheetRepository.findAll();
        } else {
            list = goalSheetRepository.findByEmployeeId(user.getId());
        }

        return ResponseEntity.ok(list);
    }

    @PostMapping("/goals/")
    public ResponseEntity<?> createGoal(@RequestBody Map<String, Object> request) {
        Long cycleId = ((Number) request.get("appraisal_cycle")).longValue();
        Optional<AppraisalCycle> cycleOpt = appraisalCycleRepository.findById(cycleId);
        if (cycleOpt.isEmpty()) return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Appraisal cycle not found"));

        Long empId = ((Number) request.get("employee")).longValue();
        Optional<User> userOpt = userService.findById(empId);
        if (userOpt.isEmpty()) return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Employee not found"));

        GoalSheet goal = GoalSheet.builder()
                .appraisalCycle(cycleOpt.get())
                .employee(userOpt.get())
                .goalTitle((String) request.get("goal_title"))
                .goalDescription((String) request.get("goal_description"))
                .targetValue(request.get("target_value") != null ? request.get("target_value").toString() : null)
                .weight(request.get("weight") != null ? ((Number) request.get("weight")).intValue() : 10)
                .status("draft")
                .build();

        goalSheetRepository.save(goal);
        return ResponseEntity.status(HttpStatus.CREATED).body(goal);
    }

    // --- PERFORMANCE APPRAISALS ---

    @GetMapping("/appraisals/")
    public ResponseEntity<?> listAppraisals(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        User user = userOpt.get();
        List<EmployeeAppraisal> list;
        if (user.isHrStaff()) {
            list = employeeAppraisalRepository.findAll();
        } else {
            list = employeeAppraisalRepository.findByEmployeeId(user.getId());
        }

        List<Map<String, Object>> results = list.stream().map(a -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("appraisal_cycle", a.getAppraisalCycle().getId());
            map.put("appraisal_cycle_name", a.getAppraisalCycle().getName());
            map.put("employee", a.getEmployee().getId());
            map.put("employee_name", a.getEmployee().getFullName());
            map.put("manager", a.getManager() != null ? a.getManager().getId() : null);
            map.put("status", a.getStatus());
            map.put("self_rating", a.getSelfRating());
            map.put("self_comments", a.getSelfComments());
            map.put("manager_rating", a.getManagerRating());
            map.put("manager_comments", a.getManagerComments());
            map.put("final_rating", a.getFinalRating());
            map.put("performance_remarks", a.getPerformanceRemarks());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }

    @PostMapping("/appraisals/")
    public ResponseEntity<?> submitSelfAppraisal(@RequestBody Map<String, Object> request) {
        Long cycleId = ((Number) request.get("appraisal_cycle")).longValue();
        Optional<AppraisalCycle> cycleOpt = appraisalCycleRepository.findById(cycleId);
        if (cycleOpt.isEmpty()) return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Appraisal cycle not found"));

        Long empId = ((Number) request.get("employee")).longValue();
        Optional<User> userOpt = userService.findById(empId);
        if (userOpt.isEmpty()) return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Employee not found"));

        EmployeeAppraisal appraisal = employeeAppraisalRepository.findByAppraisalCycleIdAndEmployeeId(cycleId, empId)
                .orElseGet(() -> EmployeeAppraisal.builder().appraisalCycle(cycleOpt.get()).employee(userOpt.get()).build());

        appraisal.setStatus("self_review");
        if (request.containsKey("self_rating")) appraisal.setSelfRating(((Number) request.get("self_rating")).intValue());
        if (request.containsKey("self_comments")) appraisal.setSelfComments((String) request.get("self_comments"));
        appraisal.setSubmittedAt(LocalDateTime.now());

        if (request.get("manager") != null) {
            userService.findById(((Number) request.get("manager")).longValue()).ifPresent(appraisal::setManager);
        }

        employeeAppraisalRepository.save(appraisal);
        return ResponseEntity.status(HttpStatus.CREATED).body(appraisal);
    }

    @PutMapping("/appraisals/{id}/")
    public ResponseEntity<?> submitManagerReview(@PathVariable("id") Long id, @RequestBody Map<String, Object> request) {
        Optional<EmployeeAppraisal> appraisalOpt = employeeAppraisalRepository.findById(id);
        if (appraisalOpt.isEmpty()) return ResponseEntity.notFound().build();

        EmployeeAppraisal appraisal = appraisalOpt.get();
        appraisal.setStatus("completed");
        if (request.containsKey("manager_rating")) appraisal.setManagerRating(((Number) request.get("manager_rating")).intValue());
        if (request.containsKey("manager_comments")) appraisal.setManagerComments((String) request.get("manager_comments"));
        if (request.containsKey("final_rating")) appraisal.setFinalRating(((Number) request.get("final_rating")).intValue());
        if (request.containsKey("performance_remarks")) appraisal.setPerformanceRemarks((String) request.get("performance_remarks"));
        appraisal.setCompletedAt(LocalDateTime.now());

        employeeAppraisalRepository.save(appraisal);
        return ResponseEntity.ok(appraisal);
    }

    // --- PROMOTIONS ---

    @PostMapping("/promotions/")
    public ResponseEntity<?> recommendPromotion(@RequestBody Map<String, Object> request, Principal principal) {
        Long empId = ((Number) request.get("employee")).longValue();
        Optional<User> userOpt = userService.findById(empId);
        if (userOpt.isEmpty()) return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Employee not found"));

        Long cycleId = ((Number) request.get("appraisal_cycle")).longValue();
        Optional<AppraisalCycle> cycleOpt = appraisalCycleRepository.findById(cycleId);
        if (cycleOpt.isEmpty()) return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Appraisal cycle not found"));

        PromotionRecommendation rec = PromotionRecommendation.builder()
                .employee(userOpt.get())
                .appraisalCycle(cycleOpt.get())
                .currentDesignation((String) request.get("current_designation"))
                .recommendedDesignation((String) request.get("recommended_designation"))
                .reason((String) request.get("reason"))
                .salaryIncrementPercentage(request.get("salary_increment_percentage") != null ? new BigDecimal(request.get("salary_increment_percentage").toString()) : BigDecimal.ZERO)
                .status("recommended")
                .build();

        if (request.get("effective_date") != null) {
            rec.setEffectiveDate(LocalDate.parse((String) request.get("effective_date")));
        }

        if (principal != null) {
            userService.findByUsername(principal.getName()).ifPresent(rec::setRecommendedBy);
        }

        promotionRecommendationRepository.save(rec);
        return ResponseEntity.status(HttpStatus.CREATED).body(rec);
    }
}

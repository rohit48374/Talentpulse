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
@RequestMapping("/api/payroll")
public class PayrollController {

    @Autowired
    private SalaryStructureRepository salaryStructureRepository;

    @Autowired
    private PayrollRunRepository payrollRunRepository;

    @Autowired
    private PayslipRepository payslipRepository;

    @Autowired
    private BonusRepository bonusRepository;

    @Autowired
    private GradeStructureRepository gradeStructureRepository;

    @Autowired
    private UserService userService;

    // --- SALARY STRUCTURE ---

    @GetMapping("/salary-structures/")
    public ResponseEntity<?> getSalaryStructure(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        User user = userOpt.get();
        List<SalaryStructure> list;
        if (user.isHrStaff() || "payroll".equalsIgnoreCase(user.getRole())) {
            list = salaryStructureRepository.findAll();
        } else {
            list = salaryStructureRepository.findByEmployeeId(user.getId()).map(Collections::singletonList).orElse(Collections.emptyList());
        }

        return ResponseEntity.ok(list);
    }

    @PutMapping("/salary-structures/{id}/")
    public ResponseEntity<?> updateSalaryStructure(@PathVariable("id") Long id, @RequestBody Map<String, Object> request) {
        Optional<SalaryStructure> structOpt = salaryStructureRepository.findById(id);
        if (structOpt.isEmpty()) return ResponseEntity.notFound().build();

        SalaryStructure struct = structOpt.get();
        if (request.containsKey("base_salary")) struct.setBaseSalary(new BigDecimal(request.get("base_salary").toString()));
        if (request.containsKey("hra")) struct.setHra(new BigDecimal(request.get("hra").toString()));
        if (request.containsKey("da")) struct.setDa(new BigDecimal(request.get("da").toString()));
        if (request.containsKey("other_allowances")) struct.setOtherAllowances(new BigDecimal(request.get("other_allowances").toString()));
        if (request.containsKey("pf_contribution")) struct.setPfContribution(new BigDecimal(request.get("pf_contribution").toString()));
        if (request.containsKey("it")) struct.setIt(new BigDecimal(request.get("it").toString()));
        if (request.containsKey("other_deductions")) struct.setOtherDeductions(new BigDecimal(request.get("other_deductions").toString()));
        if (request.containsKey("effective_from")) struct.setEffectiveFrom(LocalDate.parse((String) request.get("effective_from")));

        salaryStructureRepository.save(struct);
        return ResponseEntity.ok(struct);
    }

    // --- PAYROLL RUNS ---

    @GetMapping("/payroll-runs/")
    public ResponseEntity<?> listPayrollRuns() {
        return ResponseEntity.ok(payrollRunRepository.findAll());
    }

    @PostMapping("/payroll-runs/")
    public ResponseEntity<?> createPayrollRun(@RequestBody Map<String, Object> request, Principal principal) {
        String monthYear = (String) request.get("month_year");
        Integer totalEmployees = ((Number) request.get("total_employees")).intValue();

        PayrollRun run = PayrollRun.builder()
                .monthYear(monthYear)
                .totalEmployees(totalEmployees)
                .status("draft")
                .build();

        if (principal != null) {
            userService.findByUsername(principal.getName()).ifPresent(run::setCreatedBy);
        }

        payrollRunRepository.save(run);
        return ResponseEntity.status(HttpStatus.CREATED).body(run);
    }

    @PutMapping("/payroll-runs/{id}/")
    public ResponseEntity<?> processPayrollRun(@PathVariable("id") Long id, @RequestBody Map<String, Object> request) {
        Optional<PayrollRun> runOpt = payrollRunRepository.findById(id);
        if (runOpt.isEmpty()) return ResponseEntity.notFound().build();

        PayrollRun run = runOpt.get();
        run.setStatus((String) request.get("status"));
        if (request.containsKey("total_gross_salary")) run.setTotalGrossSalary(new BigDecimal(request.get("total_gross_salary").toString()));
        if (request.containsKey("total_deductions")) run.setTotalDeductions(new BigDecimal(request.get("total_deductions").toString()));
        if (request.containsKey("total_net_salary")) run.setTotalNetSalary(new BigDecimal(request.get("total_net_salary").toString()));

        payrollRunRepository.save(run);

        // Auto-generate payslips for all users with salary structures if status becomes processed
        if ("processed".equalsIgnoreCase(run.getStatus())) {
            List<SalaryStructure> structures = salaryStructureRepository.findAll();
            for (SalaryStructure s : structures) {
                Payslip payslip = payslipRepository.findByPayrollRunIdAndEmployeeId(run.getId(), s.getEmployee().getId())
                        .orElseGet(() -> Payslip.builder().payrollRun(run).employee(s.getEmployee()).build());

                // Sum up approved bonuses for this employee for the matching monthYear
                BigDecimal totalBonus = BigDecimal.ZERO;
                List<Bonus> bonuses = bonusRepository.findByEmployeeId(s.getEmployee().getId());
                if (bonuses != null) {
                    for (Bonus b : bonuses) {
                        if (run.getMonthYear().equals(b.getMonthYear()) && "approved".equalsIgnoreCase(b.getStatus())) {
                            totalBonus = totalBonus.add(b.getAmount());
                        }
                    }
                }

                payslip.setBaseSalary(s.getBaseSalary());
                payslip.setHra(s.getHra());
                payslip.setDa(s.getDa());
                payslip.setOtherAllowances(s.getOtherAllowances());
                payslip.setBonus(totalBonus);
                
                BigDecimal grossSalary = s.getGrossSalary().add(totalBonus);
                payslip.setGrossSalary(grossSalary);
                
                payslip.setPfContribution(s.getPfContribution());
                payslip.setIt(s.getIt());
                payslip.setOtherDeductions(s.getOtherDeductions());
                payslip.setTotalDeductions(s.getTotalDeductions());
                
                BigDecimal netSalary = grossSalary.subtract(s.getTotalDeductions());
                payslip.setNetSalary(netSalary);
                payslip.setStatus("generated");
                
                payslipRepository.save(payslip);
            }
        }

        return ResponseEntity.ok(run);
    }

    // --- PAYSLIPS ---

    @GetMapping("/payslips/")
    public ResponseEntity<?> getPayslips(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        User user = userOpt.get();
        List<Payslip> list;
        if (user.isHrStaff() || "payroll".equalsIgnoreCase(user.getRole())) {
            list = payslipRepository.findAll();
        } else {
            list = payslipRepository.findByEmployeeId(user.getId());
        }

        List<Map<String, Object>> results = list.stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("payroll_run", p.getPayrollRun().getId());
            map.put("payroll_run_month_year", p.getPayrollRun().getMonthYear());
            map.put("employee", p.getEmployee().getId());
            map.put("employee_name", p.getEmployee().getFullName());
            map.put("base_salary", p.getBaseSalary());
            map.put("hra", p.getHra());
            map.put("da", p.getDa());
            map.put("other_allowances", p.getOtherAllowances());
            map.put("bonus", p.getBonus());
            map.put("gross_salary", p.getGrossSalary());
            map.put("pf_contribution", p.getPfContribution());
            map.put("it", p.getIt());
            map.put("other_deductions", p.getOtherDeductions());
            map.put("total_deductions", p.getTotalDeductions());
            map.put("net_salary", p.getNetSalary());
            map.put("status", p.getStatus());
            map.put("payslip_date", p.getPayslipDate() != null ? p.getPayslipDate().toString() : null);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }

    // --- BONUSES ---

    @PostMapping("/bonuses/")
    public ResponseEntity<?> addBonus(@RequestBody Map<String, Object> request) {
        Long empId = ((Number) request.get("employee")).longValue();
        Optional<User> userOpt = userService.findById(empId);
        if (userOpt.isEmpty()) return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Employee not found"));

        BigDecimal amount = request.get("amount") != null ? new BigDecimal(request.get("amount").toString()) : BigDecimal.ZERO;
        Bonus bonus = Bonus.builder()
                .employee(userOpt.get())
                .bonusType((String) request.get("bonus_type"))
                .amount(amount)
                .monthYear((String) request.get("month_year"))
                .status("pending")
                .build();

        bonusRepository.save(bonus);
        return ResponseEntity.status(HttpStatus.CREATED).body(bonus);
    }
}

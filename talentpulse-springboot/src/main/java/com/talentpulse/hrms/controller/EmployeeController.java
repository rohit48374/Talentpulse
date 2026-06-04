package com.talentpulse.hrms.controller;

import com.talentpulse.hrms.model.*;
import com.talentpulse.hrms.repository.*;
import com.talentpulse.hrms.service.UserService;
import com.talentpulse.hrms.core.dto.PaginatedResponse;
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
@RequestMapping("/api/employees")
public class EmployeeController {

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private DesignationRepository designationRepository;

    @Autowired
    private GradeStructureRepository gradeStructureRepository;

    @Autowired
    private EmployeeProfileRepository employeeProfileRepository;

    @Autowired
    private EmployeeEducationRepository employeeEducationRepository;

    @Autowired
    private EmployeeExperienceRepository employeeExperienceRepository;

    @Autowired
    private EmployeeSkillRepository employeeSkillRepository;

    @Autowired
    private GrievanceRepository grievanceRepository;

    @Autowired
    private UserService userService;

    // --- DEPARTMENTS ---

    @GetMapping("/departments/")
    public ResponseEntity<?> listDepartments() {
        List<Department> departments = departmentRepository.findAll();
        List<Map<String, Object>> results = departments.stream().map(d -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", d.getId());
            map.put("name", d.getName());
            map.put("description", d.getDescription());
            map.put("budget", d.getBudget());
            map.put("cost_centre_code", d.getCostCentreCode());
            map.put("status", d.getStatus());
            map.put("head", d.getHead() != null ? d.getHead().getId() : null);
            map.put("hrbp_user", d.getHrbpUser() != null ? d.getHrbpUser().getId() : null);
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(results);
    }

    @PostMapping("/departments/")
    public ResponseEntity<?> createDepartment(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        String description = (String) request.get("description");
        BigDecimal budget = request.get("budget") != null ? new BigDecimal(request.get("budget").toString()) : null;
        String costCentreCode = (String) request.get("cost_centre_code");

        Department dept = Department.builder()
                .name(name)
                .description(description)
                .budget(budget)
                .costCentreCode(costCentreCode)
                .status("active")
                .build();

        if (request.get("head") != null) {
            userService.findById(((Number) request.get("head")).longValue()).ifPresent(dept::setHead);
        }
        if (request.get("hrbp_user") != null) {
            userService.findById(((Number) request.get("hrbp_user")).longValue()).ifPresent(dept::setHrbpUser);
        }

        departmentRepository.save(dept);
        return ResponseEntity.status(HttpStatus.CREATED).body(dept);
    }

    @RequestMapping(value = "/departments/{id}/", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<?> updateDepartment(@PathVariable("id") Long id, @RequestBody Map<String, Object> request) {
        Optional<Department> deptOpt = departmentRepository.findById(id);
        if (deptOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Department dept = deptOpt.get();

        if (request.containsKey("name")) dept.setName((String) request.get("name"));
        if (request.containsKey("description")) dept.setDescription((String) request.get("description"));
        if (request.containsKey("budget")) {
            Object budgetVal = request.get("budget");
            dept.setBudget(budgetVal != null ? new BigDecimal(budgetVal.toString()) : null);
        }
        if (request.containsKey("cost_centre_code")) dept.setCostCentreCode((String) request.get("cost_centre_code"));
        if (request.containsKey("status")) dept.setStatus((String) request.get("status"));

        if (request.containsKey("head")) {
            Object headVal = request.get("head");
            if (headVal == null) {
                dept.setHead(null);
            } else {
                userService.findById(((Number) headVal).longValue()).ifPresent(dept::setHead);
            }
        }
        if (request.containsKey("hrbp_user")) {
            Object hrbpVal = request.get("hrbp_user");
            if (hrbpVal == null) {
                dept.setHrbpUser(null);
            } else {
                userService.findById(((Number) hrbpVal).longValue()).ifPresent(dept::setHrbpUser);
            }
        }

        departmentRepository.save(dept);

        if (request.containsKey("designations")) {
            Object designationsInput = request.get("designations");
            List<String> newNames = new ArrayList<>();
            if (designationsInput instanceof String) {
                String strInput = (String) designationsInput;
                for (String s : strInput.replace("\n", ",").split(",")) {
                    if (!s.trim().isEmpty()) newNames.add(s.trim());
                }
            } else if (designationsInput instanceof List) {
                List<?> listInput = (List<?>) designationsInput;
                for (Object o : listInput) {
                    if (o != null && !o.toString().trim().isEmpty()) newNames.add(o.toString().trim());
                }
            }

            List<Designation> currentDesigs = designationRepository.findByDepartmentId(dept.getId());
            List<String> currentNames = currentDesigs.stream().map(Designation::getName).collect(Collectors.toList());

            for (String name : newNames) {
                if (!currentNames.contains(name)) {
                    Optional<Designation> existingDesigOpt = designationRepository.findAll().stream()
                            .filter(d -> name.equalsIgnoreCase(d.getName()))
                            .findFirst();
                    if (existingDesigOpt.isPresent()) {
                        Designation d = existingDesigOpt.get();
                        d.setDepartment(dept);
                        designationRepository.save(d);
                    } else {
                        Designation d = Designation.builder()
                                .name(name)
                                .department(dept)
                                .description("Designation for " + dept.getName())
                                .build();
                        designationRepository.save(d);
                    }
                }
            }

            for (Designation desig : currentDesigs) {
                if (!newNames.contains(desig.getName())) {
                    long employeeCount = employeeProfileRepository.findAll().stream()
                            .filter(p -> p.getDesignation() != null && p.getDesignation().getId().equals(desig.getId()))
                            .count();
                    if (employeeCount == 0) {
                        designationRepository.delete(desig);
                    }
                }
            }
        }

        Map<String, Object> map = new HashMap<>();
        map.put("id", dept.getId());
        map.put("name", dept.getName());
        map.put("description", dept.getDescription());
        map.put("head", dept.getHead() != null ? dept.getHead().getId() : null);
        map.put("head_name", dept.getHead() != null ? dept.getHead().getFullName() : null);
        map.put("budget", dept.getBudget());
        map.put("cost_centre_code", dept.getCostCentreCode());
        map.put("hrbp_user", dept.getHrbpUser() != null ? dept.getHrbpUser().getId() : null);
        map.put("hrbp_user_name", dept.getHrbpUser() != null ? dept.getHrbpUser().getFullName() : null);
        map.put("status", dept.getStatus());
        List<String> desigNames = designationRepository.findByDepartmentId(dept.getId()).stream()
                .map(Designation::getName)
                .collect(Collectors.toList());
        map.put("designations", desigNames);

        return ResponseEntity.ok(map);
    }

    // --- DESIGNATIONS ---

    @GetMapping("/designations/")
    public ResponseEntity<?> listDesignations(@RequestParam(value = "department", required = false) Long departmentId) {
        List<Designation> designations;
        if (departmentId != null) {
            designations = designationRepository.findByDepartmentId(departmentId);
        } else {
            designations = designationRepository.findAll();
        }
        List<Map<String, Object>> results = designations.stream().map(d -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", d.getId());
            map.put("name", d.getName());
            map.put("description", d.getDescription());
            map.put("grade", d.getGrade());
            map.put("salary_range_min", d.getSalaryRangeMin());
            map.put("salary_range_max", d.getSalaryRangeMax());
            map.put("department", d.getDepartment() != null ? d.getDepartment().getId() : null);
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(results);
    }

    @PostMapping("/designations/")
    public ResponseEntity<?> createDesignation(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        String description = (String) request.get("description");
        String grade = (String) request.get("grade");
        BigDecimal salaryMin = request.get("salary_range_min") != null ? new BigDecimal(request.get("salary_range_min").toString()) : null;
        BigDecimal salaryMax = request.get("salary_range_max") != null ? new BigDecimal(request.get("salary_range_max").toString()) : null;

        Long deptId = ((Number) request.get("department")).longValue();
        Optional<Department> deptOpt = departmentRepository.findById(deptId);
        if (deptOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Department not found"));
        }

        Designation desig = Designation.builder()
                .name(name)
                .description(description)
                .department(deptOpt.get())
                .grade(grade)
                .salaryRangeMin(salaryMin)
                .salaryRangeMax(salaryMax)
                .build();

        designationRepository.save(desig);
        return ResponseEntity.status(HttpStatus.CREATED).body(desig);
    }

    // --- GRADES ---

    @GetMapping("/grades/")
    public ResponseEntity<?> listGrades() {
        return ResponseEntity.ok(gradeStructureRepository.findAll());
    }

    @PostMapping("/grades/")
    public ResponseEntity<?> createGrade(@RequestBody GradeStructure grade) {
        gradeStructureRepository.save(grade);
        return ResponseEntity.status(HttpStatus.CREATED).body(grade);
    }

    // --- EMPLOYEE PROFILES ---

    @GetMapping("/profiles/")
    public ResponseEntity<?> listProfiles(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "page_size", defaultValue = "10") int pageSize) {
        List<EmployeeProfile> profiles = employeeProfileRepository.findAll();
        List<Map<String, Object>> results = profiles.stream().map(this::getProfileMap).collect(Collectors.toList());

        // Simple mock pagination since we have small data in SQLite dev
        PaginatedResponse<Map<String, Object>> paginatedResponse = new PaginatedResponse<>(
                results.size(),
                null,
                null,
                results
        );
        return ResponseEntity.ok(paginatedResponse);
    }

    @GetMapping("/profiles/{id}/")
    public ResponseEntity<?> getProfile(@PathVariable("id") Long id) {
        Optional<EmployeeProfile> profileOpt = employeeProfileRepository.findById(id);
        if (profileOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(getProfileMap(profileOpt.get()));
    }

    @PostMapping("/profiles/")
    public ResponseEntity<?> createProfile(@RequestBody Map<String, Object> request) {
        Long userId = ((Number) request.get("user")).longValue();
        Optional<User> userOpt = userService.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "User not found"));
        }

        EmployeeProfile profile = EmployeeProfile.builder()
                .user(userOpt.get())
                .employmentType((String) request.getOrDefault("employment_type", "permanent"))
                .status((String) request.getOrDefault("status", "active"))
                .contactNumber((String) request.get("contact_number"))
                .personalEmail((String) request.get("personal_email"))
                .emergencyContact((String) request.get("emergency_contact"))
                .emergencyPhone((String) request.get("emergency_phone"))
                .officeLocation((String) request.get("office_location"))
                .panNumber((String) request.get("pan_number"))
                .aadharNumber((String) request.get("aadhar_number"))
                .passportNumber((String) request.get("passport_number"))
                .build();

        if (request.get("department") != null) {
            departmentRepository.findById(((Number) request.get("department")).longValue()).ifPresent(profile::setDepartment);
        }
        if (request.get("designation") != null) {
            designationRepository.findById(((Number) request.get("designation")).longValue()).ifPresent(profile::setDesignation);
        }
        if (request.get("grade") != null) {
            gradeStructureRepository.findById(((Number) request.get("grade")).longValue()).ifPresent(profile::setGrade);
        }
        if (request.get("reporting_manager") != null) {
            userService.findById(((Number) request.get("reporting_manager")).longValue()).ifPresent(profile::setReportingManager);
        }
        if (request.get("date_of_birth") != null) {
            profile.setDateOfBirth(LocalDate.parse((String) request.get("date_of_birth")));
        }
        if (request.get("joining_date") != null) {
            profile.setJoiningDate(LocalDate.parse((String) request.get("joining_date")));
        }

        employeeProfileRepository.save(profile);
        return ResponseEntity.status(HttpStatus.CREATED).body(getProfileMap(profile));
    }

    @RequestMapping(value = "/profiles/{id}/", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<?> updateProfile(@PathVariable("id") Long id, @RequestBody Map<String, Object> request) {
        Optional<EmployeeProfile> profileOpt = employeeProfileRepository.findById(id);
        if (profileOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        EmployeeProfile profile = profileOpt.get();

        if (request.containsKey("contact_number")) profile.setContactNumber((String) request.get("contact_number"));
        if (request.containsKey("gender")) profile.setGender((String) request.get("gender"));
        if (request.containsKey("date_of_birth")) {
            String dob = (String) request.get("date_of_birth");
            profile.setDateOfBirth(dob != null && !dob.trim().isEmpty() ? LocalDate.parse(dob) : null);
        }
        if (request.containsKey("personal_email")) profile.setPersonalEmail((String) request.get("personal_email"));
        if (request.containsKey("emergency_contact")) profile.setEmergencyContact((String) request.get("emergency_contact"));
        if (request.containsKey("emergency_phone")) profile.setEmergencyPhone((String) request.get("emergency_phone"));
        if (request.containsKey("office_location")) profile.setOfficeLocation((String) request.get("office_location"));
        if (request.containsKey("work_phone")) profile.setWorkPhone((String) request.get("work_phone"));
        if (request.containsKey("pan_number")) profile.setPanNumber((String) request.get("pan_number"));
        if (request.containsKey("aadhar_number")) profile.setAadharNumber((String) request.get("aadhar_number"));
        if (request.containsKey("passport_number")) profile.setPassportNumber((String) request.get("passport_number"));
        if (request.containsKey("employment_type")) profile.setEmploymentType((String) request.get("employment_type"));
        if (request.containsKey("status")) profile.setStatus((String) request.get("status"));
        if (request.containsKey("joining_date")) {
            String jd = (String) request.get("joining_date");
            profile.setJoiningDate(jd != null && !jd.trim().isEmpty() ? LocalDate.parse(jd) : null);
        }

        if (request.containsKey("department")) {
            Object deptVal = request.get("department");
            if (deptVal == null) {
                profile.setDepartment(null);
            } else {
                departmentRepository.findById(((Number) deptVal).longValue()).ifPresent(profile::setDepartment);
            }
        }
        if (request.containsKey("designation")) {
            Object desigVal = request.get("designation");
            if (desigVal == null) {
                profile.setDesignation(null);
            } else {
                designationRepository.findById(((Number) desigVal).longValue()).ifPresent(profile::setDesignation);
            }
        }
        if (request.containsKey("grade")) {
            Object gradeVal = request.get("grade");
            if (gradeVal == null) {
                profile.setGrade(null);
            } else {
                gradeStructureRepository.findById(((Number) gradeVal).longValue()).ifPresent(profile::setGrade);
            }
        }
        if (request.containsKey("reporting_manager")) {
            Object mgrVal = request.get("reporting_manager");
            if (mgrVal == null) {
                profile.setReportingManager(null);
            } else {
                userService.findById(((Number) mgrVal).longValue()).ifPresent(profile::setReportingManager);
            }
        }

        employeeProfileRepository.save(profile);
        return ResponseEntity.ok(getProfileMap(profile));
    }

    // --- EDUCATION ---

    @PostMapping("/education/")
    public ResponseEntity<?> addEducation(@RequestBody Map<String, Object> request) {
        Long empId = ((Number) request.get("employee")).longValue();
        Optional<EmployeeProfile> profileOpt = employeeProfileRepository.findById(empId);
        if (profileOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Employee not found"));
        }

        EmployeeEducation edu = EmployeeEducation.builder()
                .employee(profileOpt.get())
                .institution((String) request.get("institution"))
                .qualification((String) request.get("qualification"))
                .fieldOfStudy((String) request.get("field_of_study"))
                .startDate(LocalDate.parse((String) request.get("start_date")))
                .gradeOrScore((String) request.get("grade_or_score"))
                .build();

        if (request.get("end_date") != null) {
            edu.setEndDate(LocalDate.parse((String) request.get("end_date")));
        }

        employeeEducationRepository.save(edu);
        return ResponseEntity.status(HttpStatus.CREATED).body(edu);
    }

    // --- EXPERIENCE ---

    @PostMapping("/experience/")
    public ResponseEntity<?> addExperience(@RequestBody Map<String, Object> request) {
        Long empId = ((Number) request.get("employee")).longValue();
        Optional<EmployeeProfile> profileOpt = employeeProfileRepository.findById(empId);
        if (profileOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Employee not found"));
        }

        EmployeeExperience exp = EmployeeExperience.builder()
                .employee(profileOpt.get())
                .companyName((String) request.get("company_name"))
                .designation((String) request.get("designation"))
                .startDate(LocalDate.parse((String) request.get("start_date")))
                .description((String) request.get("description"))
                .build();

        if (request.get("end_date") != null) {
            exp.setEndDate(LocalDate.parse((String) request.get("end_date")));
        }

        employeeExperienceRepository.save(exp);
        return ResponseEntity.status(HttpStatus.CREATED).body(exp);
    }

    // --- SKILLS ---

    @PostMapping("/skills/")
    public ResponseEntity<?> addSkill(@RequestBody Map<String, Object> request) {
        Long empId = ((Number) request.get("employee")).longValue();
        Optional<EmployeeProfile> profileOpt = employeeProfileRepository.findById(empId);
        if (profileOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Employee not found"));
        }

        EmployeeSkill skill = EmployeeSkill.builder()
                .employee(profileOpt.get())
                .skillName((String) request.get("skill_name"))
                .proficiency((String) request.get("proficiency"))
                .yearsOfExperience(((Number) request.getOrDefault("years_of_experience", 1)).intValue())
                .build();

        employeeSkillRepository.save(skill);
        return ResponseEntity.status(HttpStatus.CREATED).body(skill);
    }

    // --- GRIEVANCES ---

    @GetMapping("/grievances/")
    public ResponseEntity<?> listGrievances(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        List<Grievance> grievances;
        if (user.isHrStaff()) {
            grievances = grievanceRepository.findAll();
        } else {
            grievances = grievanceRepository.findByEmployeeId(user.getId());
        }
        return ResponseEntity.ok(grievances);
    }

    @PostMapping("/grievances/")
    public ResponseEntity<?> raiseGrievance(@RequestBody Map<String, Object> request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Grievance grievance = Grievance.builder()
                .employee(userOpt.get())
                .title((String) request.get("title"))
                .category((String) request.getOrDefault("category", "other"))
                .description((String) request.get("description"))
                .status("pending")
                .build();

        grievanceRepository.save(grievance);
        return ResponseEntity.status(HttpStatus.CREATED).body(grievance);
    }

    @RequestMapping(value = "/grievances/{id}/", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<?> updateGrievance(@PathVariable("id") Long id, @RequestBody Map<String, Object> request) {
        Optional<Grievance> grievanceOpt = grievanceRepository.findById(id);
        if (grievanceOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Grievance grievance = grievanceOpt.get();

        if (request.containsKey("title")) grievance.setTitle((String) request.get("title"));
        if (request.containsKey("category")) grievance.setCategory((String) request.get("category"));
        if (request.containsKey("description")) grievance.setDescription((String) request.get("description"));
        if (request.containsKey("resolution_details")) grievance.setResolutionDetails((String) request.get("resolution_details"));

        if (request.containsKey("status")) {
            String newStatus = (String) request.get("status");
            grievance.setStatus(newStatus);
            if (("resolved".equalsIgnoreCase(newStatus) || "closed".equalsIgnoreCase(newStatus)) && grievance.getResolvedAt() == null) {
                grievance.setResolvedAt(LocalDateTime.now());
            }
        }

        if (request.containsKey("assigned_to")) {
            Object assignVal = request.get("assigned_to");
            if (assignVal == null) {
                grievance.setAssignedTo(null);
            } else {
                userService.findById(((Number) assignVal).longValue()).ifPresent(grievance::setAssignedTo);
            }
        }

        grievanceRepository.save(grievance);
        return ResponseEntity.ok(grievance);
    }

    private Map<String, Object> getProfileMap(EmployeeProfile p) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", p.getId());
        map.put("employee_id", p.getUser().getEmployeeId());
        map.put("full_name", p.getUser().getFullName());
        map.put("email", p.getUser().getEmail());
        map.put("user", p.getUser().getId());
        map.put("department", p.getDepartment() != null ? p.getDepartment().getId() : null);
        map.put("designation", p.getDesignation() != null ? p.getDesignation().getId() : null);
        map.put("grade", p.getGrade() != null ? p.getGrade().getId() : null);
        map.put("reporting_manager", p.getReportingManager() != null ? p.getReportingManager().getId() : null);
        map.put("joining_date", p.getJoiningDate() != null ? p.getJoiningDate().toString() : null);
        map.put("employment_type", p.getEmploymentType());
        map.put("status", p.getStatus());
        map.put("gender", p.getGender());
        map.put("date_of_birth", p.getDateOfBirth() != null ? p.getDateOfBirth().toString() : null);
        map.put("contact_number", p.getContactNumber());
        map.put("personal_email", p.getPersonalEmail());
        map.put("emergency_contact", p.getEmergencyContact());
        map.put("emergency_phone", p.getEmergencyPhone());
        map.put("office_location", p.getOfficeLocation());
        map.put("work_phone", p.getWorkPhone());
        map.put("pan_number", p.getPanNumber());
        map.put("aadhar_number", p.getAadharNumber());
        map.put("passport_number", p.getPassportNumber());
        return map;
    }
}

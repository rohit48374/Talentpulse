package com.talentpulse.hrms.config;

import com.talentpulse.hrms.model.*;
import com.talentpulse.hrms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private LeaveTypeRepository leaveTypeRepository;

    @Autowired
    private GradeStructureRepository gradeStructureRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private DesignationRepository designationRepository;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Starting data seeding...");

        // 1. Create Leave Types
        seedLeaveType("Casual Leave", 12, true, "N", "Casual Leave for short absences");
        seedLeaveType("Sick Leave", 10, true, "N", "Sick Leave for medical issues");
        seedLeaveType("Annual Leave", 20, true, "N", "Annual paid vacation leave");
        seedLeaveType("Maternity Leave", 180, true, "F", "Maternity leave for female employees");
        seedLeaveType("Paternity Leave", 15, true, "M", "Paternity leave for male employees");
        seedLeaveType("Unpaid Leave", 30, false, "N", "Unpaid leave of absence");

        // 2. Create Grade Structures
        seedGradeStructure("A", 1, new BigDecimal("30000"));
        seedGradeStructure("B", 2, new BigDecimal("40000"));
        seedGradeStructure("C", 3, new BigDecimal("50000"));
        seedGradeStructure("D", 4, new BigDecimal("60000"));
        seedGradeStructure("E", 5, new BigDecimal("75000"));
        seedGradeStructure("F", 6, new BigDecimal("90000"));

        // 3. Create Departments
        Department engineering = seedDepartment("Engineering", "Product Development");
        Department hr = seedDepartment("Human Resources", "HR Operations");
        Department finance = seedDepartment("Finance", "Financial Management");
        Department sales = seedDepartment("Sales", "Sales and Business Development");
        Department marketing = seedDepartment("Marketing", "Marketing and Communications");

        // 4. Create Designations
        if (engineering != null) {
            seedDesignation("Junior Developer", engineering, "A", new BigDecimal("30000"), new BigDecimal("40000"), "Junior Software Developer");
            seedDesignation("Senior Developer", engineering, "C", new BigDecimal("50000"), new BigDecimal("70000"), "Senior Software Developer");
            seedDesignation("Engineering Manager", engineering, "E", new BigDecimal("75000"), new BigDecimal("100000"), "Engineering Manager");
        }
        if (hr != null) {
            seedDesignation("HR Executive", hr, "B", new BigDecimal("40000"), new BigDecimal("50000"), "Human Resources Executive");
            seedDesignation("HR Manager", hr, "D", new BigDecimal("60000"), new BigDecimal("80000"), "Human Resources Manager");
        }
        if (finance != null) {
            seedDesignation("Finance Executive", finance, "B", new BigDecimal("40000"), new BigDecimal("50000"), "Finance Executive");
        }
        if (sales != null) {
            seedDesignation("Sales Executive", sales, "B", new BigDecimal("35000"), new BigDecimal("50000"), "Sales Executive");
        }
        if (marketing != null) {
            seedDesignation("Marketing Manager", marketing, "D", new BigDecimal("60000"), new BigDecimal("80000"), "Marketing Manager");
        }

        System.out.println("Data seeding completed successfully!");
    }

    private void seedLeaveType(String name, int maxDays, boolean isPaid, String gender, String description) {
        if (!leaveTypeRepository.findByName(name).isPresent()) {
            LeaveType leaveType = LeaveType.builder()
                    .name(name)
                    .maxDaysPerYear(maxDays)
                    .isPaid(isPaid)
                    .genderSpecific(gender)
                    .description(description)
                    .build();
            leaveTypeRepository.save(leaveType);
            System.out.println("[OK] Created leave type: " + name);
        }
    }

    private void seedGradeStructure(String grade, int level, BigDecimal baseSalary) {
        if (!gradeStructureRepository.findByGrade(grade).isPresent()) {
            GradeStructure gs = GradeStructure.builder()
                    .grade(grade)
                    .level(level)
                    .baseSalary(baseSalary)
                    .minSalary(baseSalary)
                    .maxSalary(baseSalary.multiply(new BigDecimal("1.5")))
                    .build();
            gradeStructureRepository.save(gs);
            System.out.println("[OK] Created grade structure: " + grade);
        }
    }

    private Department seedDepartment(String name, String description) {
        Optional<Department> existing = departmentRepository.findByName(name);
        if (existing.isPresent()) {
            return existing.get();
        }
        Department dept = Department.builder()
                .name(name)
                .description(description)
                .status("active")
                .build();
        Department saved = departmentRepository.save(dept);
        System.out.println("[OK] Created department: " + name);
        return saved;
    }

    private void seedDesignation(String name, Department dept, String grade, BigDecimal minSalary, BigDecimal maxSalary, String description) {
        if (!designationRepository.findByName(name).isPresent()) {
            Designation desig = Designation.builder()
                    .name(name)
                    .department(dept)
                    .grade(grade)
                    .salaryRangeMin(minSalary)
                    .salaryRangeMax(maxSalary)
                    .description(description)
                    .build();
            designationRepository.save(desig);
            System.out.println("[OK] Created designation: " + name);
        }
    }
}

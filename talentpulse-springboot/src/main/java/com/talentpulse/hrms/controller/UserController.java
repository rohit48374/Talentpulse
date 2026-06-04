package com.talentpulse.hrms.controller;

import com.talentpulse.hrms.security.JwtTokenUtil;
import com.talentpulse.hrms.model.User;
import com.talentpulse.hrms.model.AuditLog;
import com.talentpulse.hrms.model.EmployeeProfile;
import com.talentpulse.hrms.repository.AuditLogRepository;
import com.talentpulse.hrms.repository.EmployeeProfileRepository;
import com.talentpulse.hrms.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/accounts")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private EmployeeProfileRepository employeeProfileRepository;

    @PostMapping("/users/register/")
    public ResponseEntity<?> register() {
        Map<String, String> err = new HashMap<>();
        err.put("error", "Public registration is disabled. Please contact your HR department or System Administrator.");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err);
    }

    @PostMapping("/users/login/")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request, HttpServletRequest servletRequest) {
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || password == null) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Email and password are required");
            return ResponseEntity.badRequest().body(err);
        }

        Optional<User> userOpt = userService.findByEmail(email)
                .or(() -> userService.findByEmployeeId(email))
                .or(() -> userService.findByUsername(email));

        if (userOpt.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            if (email.contains("@")) {
                err.put("error", "No account exists with this email address.");
            } else {
                err.put("error", "No account exists with this Employee ID.");
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "The password you entered is incorrect.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
        }

        if (!user.isActive()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Account is inactive");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
        }

        String access = jwtTokenUtil.generateToken(user.getUsername(), user.getRole(), user.getId());
        String refresh = jwtTokenUtil.generateToken(user.getUsername(), user.getRole(), user.getId());

        // Log audit
        AuditLog audit = AuditLog.builder()
                .user(user)
                .action("login")
                .modelName("User")
                .objectId(user.getId())
                .ipAddress(getClientIp(servletRequest))
                .changes("{}")
                .build();
        auditLogRepository.save(audit);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Login successful");
        response.put("access", access);
        response.put("refresh", refresh);

        // Serialize user details
        Map<String, Object> uDetails = getUserDetailsMap(user);
        response.put("user", uDetails);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/users/logout/")
    public ResponseEntity<?> logout(HttpServletRequest servletRequest, Principal principal) {
        if (principal != null) {
            Optional<User> userOpt = userService.findByUsername(principal.getName());
            userOpt.ifPresent(user -> {
                AuditLog audit = AuditLog.builder()
                        .user(user)
                        .action("logout")
                        .modelName("User")
                        .objectId(user.getId())
                        .ipAddress(getClientIp(servletRequest))
                        .changes("{}")
                        .build();
                auditLogRepository.save(audit);
            });
        }
        Map<String, String> resp = new HashMap<>();
        resp.put("message", "Logout successful");
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/users/profile/")
    public ResponseEntity<?> profile(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(getUserDetailsMap(userOpt.get()));
    }

    @PutMapping("/users/update_profile/")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> request, HttpServletRequest servletRequest, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOpt.get();

        if (request.containsKey("full_name")) {
            user.setFullName((String) request.get("full_name"));
        }
        if (request.containsKey("phone")) {
            user.setPhone((String) request.get("phone"));
        }
        if (request.containsKey("address")) {
            user.setAddress((String) request.get("address"));
        }
        userService.saveUser(user);

        // Log audit
        AuditLog audit = AuditLog.builder()
                .user(user)
                .action("update")
                .modelName("User")
                .objectId(user.getId())
                .ipAddress(getClientIp(servletRequest))
                .changes(request.toString())
                .build();
        auditLogRepository.save(audit);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Profile updated successfully");
        response.put("user", getUserDetailsMap(user));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/users/change_password/")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request, HttpServletRequest servletRequest, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOpt.get();

        String oldPassword = request.get("old_password");
        String newPassword = request.get("new_password");

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Old password is incorrect");
            return ResponseEntity.badRequest().body(err);
        }

        user.setPassword(newPassword); // Will be encoded inside saveUser
        userService.saveUser(user);

        // Log audit
        AuditLog audit = AuditLog.builder()
                .user(user)
                .action("update")
                .modelName("User")
                .objectId(user.getId())
                .ipAddress(getClientIp(servletRequest))
                .changes("{ \"field\": \"password\" }")
                .build();
        auditLogRepository.save(audit);

        Map<String, String> resp = new HashMap<>();
        resp.put("message", "Password changed successfully");
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/users/forgot_password/")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request, HttpServletRequest servletRequest) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Email is required"));
        }

        Optional<User> userOpt = userService.findByEmail(email);
        String token = String.format("%06d", new Random().nextInt(900000) + 100000);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setResetToken(token);
            user.setResetTokenExpiresAt(LocalDateTime.now().plusHours(1));
            userService.saveUser(user);

            // Log audit
            AuditLog audit = AuditLog.builder()
                    .user(user)
                    .action("update")
                    .modelName("User")
                    .objectId(user.getId())
                    .ipAddress(getClientIp(servletRequest))
                    .changes("{ \"action\": \"request_password_reset\" }")
                    .build();
            auditLogRepository.save(audit);
        }

        Map<String, String> response = new HashMap<>();
        response.put("message", "If a user with this email exists, a password reset code has been sent.");
        response.put("token", token);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/users/reset_password/")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request, HttpServletRequest servletRequest) {
        String email = request.get("email");
        String token = request.get("token");
        String newPassword = request.get("new_password");
        String newPasswordConfirm = request.get("new_password_confirm");

        if (email == null || token == null || newPassword == null || newPasswordConfirm == null) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "All fields are required"));
        }

        if (!newPassword.equals(newPasswordConfirm)) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Passwords do not match"));
        }

        Optional<User> userOpt = userService.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (token.equals(user.getResetToken()) && user.getResetTokenExpiresAt() != null && user.getResetTokenExpiresAt().isAfter(LocalDateTime.now())) {
                user.setPassword(newPassword);
                user.setResetToken(null);
                user.setResetTokenExpiresAt(null);
                userService.saveUser(user);

                // Log audit
                AuditLog audit = AuditLog.builder()
                        .user(user)
                        .action("update")
                        .modelName("User")
                        .objectId(user.getId())
                        .ipAddress(getClientIp(servletRequest))
                        .changes("{ \"action\": \"reset_password_success\" }")
                        .build();
                auditLogRepository.save(audit);

                return ResponseEntity.ok(Collections.singletonMap("message", "Password has been reset successfully."));
            }
        }

        return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Invalid or expired password reset code."));
    }

    @GetMapping("/users/me/")
    public ResponseEntity<?> me(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        Optional<EmployeeProfile> empOpt = employeeProfileRepository.findByUserId(user.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("user", getUserDetailsMap(user));
        response.put("employee", empOpt.isPresent() ? getEmployeeProfileMap(empOpt.get()) : null);

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/users/me/")
    public ResponseEntity<?> updateMe(@RequestBody Map<String, Object> request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        if (request.containsKey("first_name") || request.containsKey("last_name")) {
            String fName = (String) request.getOrDefault("first_name", "");
            String lName = (String) request.getOrDefault("last_name", "");
            user.setFullName((fName + " " + lName).trim());
        }
        if (request.containsKey("phone")) {
            user.setPhone((String) request.get("phone"));
        } else if (request.containsKey("phone_number")) {
            user.setPhone((String) request.get("phone_number"));
        }
        if (request.containsKey("address")) {
            user.setAddress((String) request.get("address"));
        }
        userService.saveUser(user);

        EmployeeProfile employee = employeeProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> EmployeeProfile.builder().user(user).build());

        if (request.containsKey("phone_number")) {
            employee.setContactNumber((String) request.get("phone_number"));
        } else if (request.containsKey("phone")) {
            employee.setContactNumber((String) request.get("phone"));
        }
        if (request.containsKey("gender")) {
            String gVal = (String) request.get("gender");
            if (gVal != null) {
                if (gVal.toUpperCase().startsWith("M")) employee.setGender("M");
                else if (gVal.toUpperCase().startsWith("F")) employee.setGender("F");
                else employee.setGender("O");
            }
        }
        if (request.containsKey("date_of_birth")) {
            String dob = (String) request.get("date_of_birth");
            if (dob != null && !dob.trim().isEmpty()) {
                employee.setDateOfBirth(LocalDate.parse(dob));
            }
        }
        if (request.containsKey("personal_email")) {
            employee.setPersonalEmail((String) request.get("personal_email"));
        }
        if (request.containsKey("emergency_contact")) {
            employee.setEmergencyContact((String) request.get("emergency_contact"));
        }
        if (request.containsKey("emergency_phone")) {
            employee.setEmergencyPhone((String) request.get("emergency_phone"));
        }
        if (request.containsKey("office_location")) {
            employee.setOfficeLocation((String) request.get("office_location"));
        }
        employeeProfileRepository.save(employee);

        Map<String, Object> response = new HashMap<>();
        response.put("user", getUserDetailsMap(user));
        response.put("employee", getEmployeeProfileMap(employee));

        return ResponseEntity.ok(response);
    }

    private Map<String, Object> getUserDetailsMap(User user) {
        Map<String, Object> u = new HashMap<>();
        u.put("id", user.getId());
        u.put("username", user.getUsername());
        u.put("email", user.getEmail());
        u.put("employee_id", user.getEmployeeId());
        u.put("full_name", user.getFullName());
        u.put("phone", user.getPhone());
        u.put("role", user.getRole());
        u.put("department", user.getDepartment());
        u.put("designation", user.getDesignation());
        u.put("profile_image", user.getProfileImage());
        u.put("address", user.getAddress());
        u.put("salary", user.getSalary());
        u.put("joining_date", user.getJoiningDate() != null ? user.getJoiningDate().toString() : null);
        u.put("status", user.getStatus());
        return u;
    }

    private Map<String, Object> getEmployeeProfileMap(EmployeeProfile emp) {
        Map<String, Object> e = new HashMap<>();
        e.put("id", emp.getId());
        e.put("contact_number", emp.getContactNumber());
        e.put("gender", emp.getGender());
        e.put("date_of_birth", emp.getDateOfBirth() != null ? emp.getDateOfBirth().toString() : null);
        e.put("personal_email", emp.getPersonalEmail());
        e.put("emergency_contact", emp.getEmergencyContact());
        e.put("emergency_phone", emp.getEmergencyPhone());
        e.put("office_location", emp.getOfficeLocation());
        e.put("employment_type", emp.getEmploymentType());
        e.put("status", emp.getStatus());
        return e;
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0];
        }
        return request.getRemoteAddr();
    }
}

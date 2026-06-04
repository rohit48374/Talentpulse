package com.talentpulse.hrms.controller;

import com.talentpulse.hrms.security.JwtTokenUtil;
import com.talentpulse.hrms.model.User;
import com.talentpulse.hrms.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/token")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/")
    public ResponseEntity<?> obtainToken(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || password == null) {
            Map<String, String> err = new HashMap<>();
            err.put("detail", "Email and password are required");
            return ResponseEntity.badRequest().body(err);
        }

        // Try both email and username (Django custom authenticate supports email)
        Optional<User> userOpt = userService.findByEmail(email)
                .or(() -> userService.findByUsername(email))
                .or(() -> userService.findByEmployeeId(email));

        if (userOpt.isEmpty() || !passwordEncoder.matches(password, userOpt.get().getPassword())) {
            Map<String, String> err = new HashMap<>();
            err.put("detail", "No active account found with the given credentials");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
        }

        User user = userOpt.get();
        if (!user.isActive()) {
            Map<String, String> err = new HashMap<>();
            err.put("detail", "User account is inactive");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
        }

        String access = jwtTokenUtil.generateToken(user.getUsername(), user.getRole(), user.getId());
        String refresh = jwtTokenUtil.generateToken(user.getUsername(), user.getRole(), user.getId()); // In our stateless system, we can reuse

        Map<String, String> response = new HashMap<>();
        response.put("access", access);
        response.put("refresh", refresh);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh/")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        String refresh = request.get("refresh");
        if (refresh == null) {
            Map<String, String> err = new HashMap<>();
            err.put("detail", "Refresh token is required");
            return ResponseEntity.badRequest().body(err);
        }

        try {
            String username = jwtTokenUtil.getUsernameFromToken(refresh);
            Optional<User> userOpt = userService.findByUsername(username);

            if (userOpt.isPresent() && jwtTokenUtil.validateToken(refresh, username)) {
                User user = userOpt.get();
                String access = jwtTokenUtil.generateToken(user.getUsername(), user.getRole(), user.getId());
                Map<String, String> response = new HashMap<>();
                response.put("access", access);
                response.put("refresh", refresh);
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            // Token validation failed
        }

        Map<String, String> err = new HashMap<>();
        err.put("detail", "Token is invalid or expired");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
    }
}

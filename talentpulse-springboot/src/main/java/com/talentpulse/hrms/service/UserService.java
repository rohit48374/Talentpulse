package com.talentpulse.hrms.service;

import com.talentpulse.hrms.model.User;
import com.talentpulse.hrms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findByEmployeeId(String employeeId) {
        return userRepository.findByEmployeeId(employeeId);
    }

    @Transactional
    public User saveUser(User user) {
        if (user.getPassword() != null && !user.getPassword().startsWith("$2a$")) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        if (user.getEmployeeId() == null || user.getEmployeeId().trim().isEmpty()) {
            user.setEmployeeId(generateEmployeeId());
        }
        return userRepository.save(user);
    }

    @Transactional
    public synchronized String generateEmployeeId() {
        int currentYear = LocalDate.now().getYear();
        String prefix = String.valueOf(currentYear);

        List<User> users = userRepository.findLatestEmployeeIdWithPrefix(prefix);
        int seq = 1;
        if (!users.isEmpty()) {
            String latestEmpId = users.get(0).getEmployeeId();
            if (latestEmpId != null && latestEmpId.length() == 10) {
                try {
                    seq = Integer.parseInt(latestEmpId.substring(4)) + 1;
                } catch (NumberFormatException ignored) {}
            }
        }
        return String.format("%s%06d", prefix, seq);
    }
}

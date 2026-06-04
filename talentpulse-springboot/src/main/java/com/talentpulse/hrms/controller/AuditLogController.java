package com.talentpulse.hrms.controller;

import com.talentpulse.hrms.model.AuditLog;
import com.talentpulse.hrms.model.User;
import com.talentpulse.hrms.repository.AuditLogRepository;
import com.talentpulse.hrms.service.UserService;
import com.talentpulse.hrms.core.dto.PaginatedResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/accounts/audit-logs")
public class AuditLogController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserService userService;

    @GetMapping("/")
    public ResponseEntity<?> getAuditLogs(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "page_size", defaultValue = "10") int pageSize,
            Principal principal) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "timestamp"));

        Page<AuditLog> auditLogsPage;
        if (user.isHrStaff()) {
            auditLogsPage = auditLogRepository.findAll(pageable);
        } else {
            auditLogsPage = auditLogRepository.findByUserId(user.getId(), pageable);
        }

        List<Map<String, Object>> results = auditLogsPage.getContent().stream().map(log -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", log.getId());
            map.put("action", log.getAction());
            map.put("model_name", log.getModelName());
            map.put("object_id", log.getObjectId());
            map.put("changes", log.getChanges());
            map.put("ip_address", log.getIpAddress());
            map.put("user_agent", log.getUserAgent());
            map.put("timestamp", log.getTimestamp().toString());

            Map<String, Object> u = new HashMap<>();
            u.put("id", log.getUser().getId());
            u.put("full_name", log.getUser().getFullName());
            u.put("email", log.getUser().getEmail());
            map.put("user", u);

            return map;
        }).collect(Collectors.toList());

        PaginatedResponse<Map<String, Object>> paginatedResponse = new PaginatedResponse<>(
                auditLogsPage.getTotalElements(),
                auditLogsPage.hasNext() ? "?page=" + (page + 1) : null,
                auditLogsPage.hasPrevious() ? "?page=" + (page - 1) : null,
                results
        );

        return ResponseEntity.ok(paginatedResponse);
    }
}

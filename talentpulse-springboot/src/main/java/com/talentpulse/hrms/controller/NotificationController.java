package com.talentpulse.hrms.controller;

import com.talentpulse.hrms.model.Notification;
import com.talentpulse.hrms.model.NotificationPreference;
import com.talentpulse.hrms.model.User;
import com.talentpulse.hrms.repository.NotificationPreferenceRepository;
import com.talentpulse.hrms.repository.NotificationRepository;
import com.talentpulse.hrms.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationPreferenceRepository notificationPreferenceRepository;

    @Autowired
    private UserService userService;

    @GetMapping("/")
    public ResponseEntity<?> listNotifications(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        List<Notification> list = notificationRepository.findByRecipientId(userOpt.get().getId());
        List<Map<String, Object>> results = list.stream().map(n -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", n.getId());
            map.put("notification_type", n.getNotificationType());
            map.put("title", n.getTitle());
            map.put("message", n.getMessage());
            map.put("status", n.getStatus());
            map.put("created_at", n.getCreatedAt() != null ? n.getCreatedAt().toString() : null);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }

    @PostMapping("/{id}/mark_as_read/")
    public ResponseEntity<?> markAsRead(@PathVariable("id") Long id) {
        Optional<Notification> noteOpt = notificationRepository.findById(id);
        if (noteOpt.isEmpty()) return ResponseEntity.notFound().build();

        Notification note = noteOpt.get();
        note.setStatus("read");
        note.setReadAt(LocalDateTime.now());
        notificationRepository.save(note);

        return ResponseEntity.ok(Collections.singletonMap("message", "Notification marked as read"));
    }

    @GetMapping("/unread_count/")
    public ResponseEntity<?> getUnreadCount(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        long count = notificationRepository.countByRecipientIdAndStatus(userOpt.get().getId(), "unread");
        return ResponseEntity.ok(Collections.singletonMap("unread_count", count));
    }

    @GetMapping("/preferences/list/")
    public ResponseEntity<?> getPreferences(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        NotificationPreference pref = notificationPreferenceRepository.findByUserId(userOpt.get().getId())
                .orElseGet(() -> NotificationPreference.builder().user(userOpt.get()).build());

        return ResponseEntity.ok(pref);
    }

    @PutMapping("/preferences/update/")
    public ResponseEntity<?> updatePreferences(@RequestBody Map<String, Object> request, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<User> userOpt = userService.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        NotificationPreference pref = notificationPreferenceRepository.findByUserId(userOpt.get().getId())
                .orElseGet(() -> NotificationPreference.builder().user(userOpt.get()).build());

        if (request.containsKey("leave_notifications")) pref.setLeaveNotifications((String) request.get("leave_notifications"));
        if (request.containsKey("payroll_notifications")) pref.setPayrollNotifications((String) request.get("payroll_notifications"));
        if (request.containsKey("recruitment_notifications")) pref.setRecruitmentNotifications((String) request.get("recruitment_notifications"));
        if (request.containsKey("appraisal_notifications")) pref.setAppraisalNotifications((String) request.get("appraisal_notifications"));
        if (request.containsKey("attendance_notifications")) pref.setAttendanceNotifications((String) request.get("attendance_notifications"));
        if (request.containsKey("email_notifications")) pref.setEmailNotifications((Boolean) request.get("email_notifications"));
        if (request.containsKey("push_notifications")) pref.setPushNotifications((Boolean) request.get("push_notifications"));

        notificationPreferenceRepository.save(pref);
        return ResponseEntity.ok(pref);
    }
}

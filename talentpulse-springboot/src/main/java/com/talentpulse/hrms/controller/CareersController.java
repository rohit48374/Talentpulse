package com.talentpulse.hrms.controller;

import com.talentpulse.hrms.security.JwtTokenUtil;
import com.talentpulse.hrms.model.*;
import com.talentpulse.hrms.repository.*;
import com.talentpulse.hrms.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/recruitment/careers")
public class CareersController {

    @Autowired
    private CandidateAccountRepository candidateAccountRepository;

    @Autowired
    private JobRequisitionRepository jobRequisitionRepository;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private InterviewRoundRepository interviewRoundRepository;

    @Autowired
    private OfferLetterRepository offerLetterRepository;

    @Autowired
    private InterviewChatMessageRepository interviewChatMessageRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Long getAuthCandidateId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof Long) {
            return (Long) principal;
        }
        return null;
    }

    @PostMapping("/auth/register/")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        String fullName = request.get("full_name");
        String phone = request.get("phone");

        if (email == null || password == null || fullName == null) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Email, password, and full name are required."));
        }

        if (candidateAccountRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("email", Collections.singletonList("A candidate account with this email already exists.")));
        }

        CandidateAccount candidate = CandidateAccount.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .fullName(fullName)
                .phone(phone)
                .isVerified(false)
                .build();

        String verToken = UUID.randomUUID().toString().replace("-", "");
        String otp = String.format("%06d", new Random().nextInt(900000) + 100000);

        candidate.setVerificationToken(verToken);
        candidate.setOtpCode(otp);
        candidate.setOtpCreatedAt(LocalDateTime.now());

        candidateAccountRepository.save(candidate);

        // Async email
        emailService.sendVerificationEmail(email, fullName, verToken, otp);

        String token = jwtTokenUtil.generateCandidateToken(candidate.getId(), email);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Account registered successfully. Please verify your email.");
        response.put("token", token);
        response.put("candidate", getCandidateAccountMap(candidate));

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/auth/login/")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Email and password are required."));
        }

        Optional<CandidateAccount> candOpt = candidateAccountRepository.findByEmail(email);
        if (candOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.singletonMap("error", "No account exists with this email address."));
        }

        CandidateAccount candidate = candOpt.get();
        if (!passwordEncoder.matches(password, candidate.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.singletonMap("error", "Incorrect password."));
        }

        String token = jwtTokenUtil.generateCandidateToken(candidate.getId(), email);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Login successful.");
        response.put("token", token);
        response.put("candidate", getCandidateAccountMap(candidate));

        return ResponseEntity.ok(response);
    }

    @PostMapping("/auth/verify/")
    public ResponseEntity<?> verifyEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String token = request.get("token");
        String otp = request.get("otp");

        if (email == null) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Email is required."));
        }

        Optional<CandidateAccount> candOpt = Optional.empty();
        if (otp != null && !otp.trim().isEmpty()) {
            candOpt = candidateAccountRepository.findByEmailAndOtpCode(email, otp);
        } else if (token != null && !token.trim().isEmpty()) {
            candOpt = candidateAccountRepository.findByEmailAndVerificationToken(email, token);
        }

        if (candOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Invalid verification details or expired session."));
        }

        CandidateAccount candidate = candOpt.get();
        candidate.setVerified(true);
        candidate.setOtpCode(null);
        candidate.setVerificationToken(null);
        candidateAccountRepository.save(candidate);

        String jwtToken = jwtTokenUtil.generateCandidateToken(candidate.getId(), email);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Email address successfully verified! You can now apply for jobs.");
        response.put("token", jwtToken);
        response.put("candidate", getCandidateAccountMap(candidate));

        return ResponseEntity.ok(response);
    }

    @PostMapping("/auth/forgot-password/")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email != null) {
            email = email.trim().toLowerCase();
        }

        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Email is required."));
        }

        Optional<CandidateAccount> candidateOpt = candidateAccountRepository.findByEmail(email);
        if (candidateOpt.isEmpty()) {
            return ResponseEntity.ok(Collections.singletonMap("message", "If an account exists, a password reset link has been dispatched."));
        }

        CandidateAccount candidate = candidateOpt.get();
        String otp = String.format("%06d", new Random().nextInt(900000) + 100000);
        candidate.setOtpCode(otp);
        candidate.setOtpCreatedAt(LocalDateTime.now());
        candidateAccountRepository.save(candidate);

        emailService.sendPasswordResetEmail(candidate.getEmail(), candidate.getFullName(), otp);

        return ResponseEntity.ok(Collections.singletonMap("message", "If an account exists, a password reset link has been dispatched."));
    }

    @PostMapping("/auth/reset-password/")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        String newPassword = request.get("new_password");

        if (email != null) {
            email = email.trim().toLowerCase();
        }
        if (otp != null) {
            otp = otp.trim();
        }

        if (email == null || email.isEmpty() || otp == null || otp.isEmpty() || newPassword == null || newPassword.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Email, OTP, and new password are required."));
        }

        Optional<CandidateAccount> candidateOpt = candidateAccountRepository.findByEmailAndOtpCode(email, otp);
        if (candidateOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Invalid or expired password reset OTP."));
        }

        CandidateAccount candidate = candidateOpt.get();
        candidate.setPassword(passwordEncoder.encode(newPassword));
        candidate.setOtpCode(null);
        candidateAccountRepository.save(candidate);

        return ResponseEntity.ok(Collections.singletonMap("message", "Password has been reset successfully."));
    }

    @GetMapping("/profile/")
    public ResponseEntity<?> getProfile() {
        Long id = getAuthCandidateId();
        if (id == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Optional<CandidateAccount> candOpt = candidateAccountRepository.findById(id);
        if (candOpt.isEmpty()) return ResponseEntity.notFound().build();

        return ResponseEntity.ok(getCandidateAccountMap(candOpt.get()));
    }

    @PatchMapping("/profile/")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> request) {
        Long id = getAuthCandidateId();
        if (id == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Optional<CandidateAccount> candOpt = candidateAccountRepository.findById(id);
        if (candOpt.isEmpty()) return ResponseEntity.notFound().build();

        CandidateAccount candidate = candOpt.get();
        if (request.containsKey("full_name")) candidate.setFullName((String) request.get("full_name"));
        if (request.containsKey("phone")) candidate.setPhone((String) request.get("phone"));
        if (request.containsKey("location")) candidate.setLocation((String) request.get("location"));
        if (request.containsKey("experience")) candidate.setExperience((String) request.get("experience"));
        if (request.containsKey("skills")) candidate.setSkills((String) request.get("skills"));
        if (request.containsKey("qualification")) candidate.setQualification((String) request.get("qualification"));
        if (request.containsKey("linkedin_url")) candidate.setLinkedinUrl((String) request.get("linkedin_url"));
        if (request.containsKey("portfolio_url")) candidate.setPortfolioUrl((String) request.get("portfolio_url"));
        if (request.containsKey("resume")) candidate.setResume((String) request.get("resume"));

        candidateAccountRepository.save(candidate);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Profile updated successfully.");
        response.put("candidate", getCandidateAccountMap(candidate));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/jobs/")
    public ResponseEntity<?> listJobs(@RequestParam(value = "search", required = false) String search) {
        List<JobRequisition> reqs = jobRequisitionRepository.findByStatus("open");
        if (search != null && !search.trim().isEmpty()) {
            reqs = reqs.stream().filter(j -> j.getTitle().toLowerCase().contains(search.toLowerCase()) || j.getDescription().toLowerCase().contains(search.toLowerCase())).collect(Collectors.toList());
        }

        List<Map<String, Object>> results = reqs.stream().map(j -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", j.getId());
            map.put("title", j.getTitle());
            map.put("description", j.getDescription());
            map.put("department", j.getDepartment());
            map.put("designation", j.getDesignation());
            map.put("position_count", j.getPositionCount());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }

    @GetMapping("/jobs/{id}/")
    public ResponseEntity<?> getJob(@PathVariable("id") Long id) {
        Optional<JobRequisition> reqOpt = jobRequisitionRepository.findById(id);
        if (reqOpt.isEmpty() || !"open".equalsIgnoreCase(reqOpt.get().getStatus())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("error", "Job posting not found or is closed."));
        }
        JobRequisition j = reqOpt.get();
        Map<String, Object> map = new HashMap<>();
        map.put("id", j.getId());
        map.put("title", j.getTitle());
        map.put("description", j.getDescription());
        map.put("department", j.getDepartment());
        map.put("designation", j.getDesignation());
        map.put("position_count", j.getPositionCount());
        return ResponseEntity.ok(map);
    }

    @PostMapping("/applications/apply/")
    public ResponseEntity<?> applyJob(@RequestBody Map<String, Object> request) {
        Long id = getAuthCandidateId();
        if (id == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Optional<CandidateAccount> candOpt = candidateAccountRepository.findById(id);
        if (candOpt.isEmpty()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        CandidateAccount candidateAccount = candOpt.get();

        if (!candidateAccount.isVerified()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Collections.singletonMap("error", "Email verification is required before you can apply."));
        }

        Long reqId = ((Number) request.get("job_requisition_id")).longValue();
        Optional<JobRequisition> reqOpt = jobRequisitionRepository.findById(reqId);
        if (reqOpt.isEmpty() || !"open".equalsIgnoreCase(reqOpt.get().getStatus())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("error", "Job posting not found or is closed."));
        }
        JobRequisition job = reqOpt.get();

        if (candidateRepository.findByJobRequisitionIdAndEmail(job.getId(), candidateAccount.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "You have already applied for this position."));
        }

        String[] nameParts = candidateAccount.getFullName().split(" ", 2);
        String firstName = nameParts[0];
        String lastName = nameParts.length > 1 ? nameParts[1] : "";

        Candidate application = Candidate.builder()
                .candidateAccount(candidateAccount)
                .jobRequisition(job)
                .firstName(firstName)
                .lastName(lastName)
                .email(candidateAccount.getEmail())
                .phone(candidateAccount.getPhone())
                .currentCompany(candidateAccount.getCurrentCompany())
                .currentDesignation(candidateAccount.getCurrentRole())
                .coverLetter((String) request.get("cover_letter"))
                .resume(candidateAccount.getResume())
                .status("applied")
                .build();

        candidateRepository.save(application);

        // Async emails
        emailService.sendApplicationConfirmation(candidateAccount.getEmail(), candidateAccount.getFullName(), job.getTitle());
        userRepository.findAll().stream().filter(u -> "recruiter".equalsIgnoreCase(u.getRole())).forEach(r -> {
            emailService.sendRecruiterNewApplicationAlert(r.getEmail(), candidateAccount.getFullName(), candidateAccount.getEmail(), job.getTitle());
        });

        return ResponseEntity.status(HttpStatus.CREATED).body(Collections.singletonMap("message", "Application submitted successfully."));
    }

    @GetMapping("/applications/")
    public ResponseEntity<?> getApplications() {
        Long id = getAuthCandidateId();
        if (id == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        List<Candidate> apps = candidateRepository.findByCandidateAccountId(id);
        List<Map<String, Object>> results = apps.stream().map(a -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("status", a.getStatus());
            map.put("job_title", a.getJobRequisition().getTitle());
            map.put("applied_date", a.getAppliedDate() != null ? a.getAppliedDate().toString() : null);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }

    @GetMapping("/interviews/")
    public ResponseEntity<?> getInterviews() {
        Long id = getAuthCandidateId();
        if (id == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        List<InterviewRound> rounds = interviewRoundRepository.findByCandidateCandidateAccountId(id);
        List<Map<String, Object>> results = rounds.stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("interview_type", r.getInterviewType());
            map.put("scheduled_date", r.getScheduledDate() != null ? r.getScheduledDate().toString() : null);
            map.put("status", r.getStatus());
            map.put("meeting_link", r.getMeetingLink());
            map.put("interviewer_name", r.getInterviewer() != null ? r.getInterviewer().getFullName() : null);
            map.put("job_title", r.getRequisition() != null ? r.getRequisition().getTitle() : null);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }

    @GetMapping("/offers/")
    public ResponseEntity<?> getOffers() {
        Long id = getAuthCandidateId();
        if (id == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        List<OfferLetter> offers = offerLetterRepository.findByCandidateCandidateAccountId(id);
        List<Map<String, Object>> results = offers.stream().map(o -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", o.getId());
            map.put("position_title", o.getPositionTitle());
            map.put("salary", o.getSalary());
            map.put("start_date", o.getStartDate() != null ? o.getStartDate().toString() : null);
            map.put("offer_validity", o.getOfferValidity() != null ? o.getOfferValidity().toString() : null);
            map.put("status", o.getStatus());
            map.put("document", o.getDocument());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }

    @PatchMapping("/offers/")
    public ResponseEntity<?> handleOffer(@RequestBody Map<String, Object> request) {
        Long id = getAuthCandidateId();
        if (id == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Long offerId = ((Number) request.get("offer_id")).longValue();
        String status = (String) request.get("status");

        Optional<OfferLetter> offerOpt = offerLetterRepository.findByIdAndCandidateCandidateAccountId(offerId, id);
        if (offerOpt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        OfferLetter offer = offerOpt.get();
        offer.setStatus(status);
        offerLetterRepository.save(offer);

        Candidate candidate = offer.getCandidate();
        if ("accepted".equalsIgnoreCase(status)) {
            candidate.setStatus("offer_accepted");
            candidateRepository.save(candidate);

            // Emails
            emailService.sendWelcomeEmail(candidate.getEmail(), candidate.getFullName(), offer.getPositionTitle(), offer.getStartDate().toString());
            userRepository.findAll().stream().filter(u -> "hr".equalsIgnoreCase(u.getRole())).forEach(h -> {
                emailService.sendHrOfferAcceptedAlert(h.getEmail(), candidate.getFullName(), candidate.getEmail(), offer.getPositionTitle(), offer.getStartDate().toString());
            });
        } else {
            candidate.setStatus("rejected");
            candidateRepository.save(candidate);
        }

        return ResponseEntity.ok(Collections.singletonMap("message", "Offer successfully updated."));
    }

    @GetMapping("/interviews/{id}/chat/")
    public ResponseEntity<?> getChatMessages(@PathVariable("id") Long id) {
        Long candId = getAuthCandidateId();
        if (candId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Optional<InterviewRound> roundOpt = interviewRoundRepository.findByIdAndCandidateCandidateAccountId(id, candId);
        if (roundOpt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        List<InterviewChatMessage> msgs = interviewChatMessageRepository.findByInterviewRoundIdOrderByTimestampAsc(id);
        List<Map<String, Object>> results = msgs.stream().map(m -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("sender_type", m.getSenderType());
            map.put("sender_name", m.getSenderName());
            map.put("message", m.getMessage());
            map.put("timestamp", m.getTimestamp() != null ? m.getTimestamp().toString() : null);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }

    @PostMapping("/interviews/{id}/chat/")
    public ResponseEntity<?> postChatMessage(@PathVariable("id") Long id, @RequestBody Map<String, String> request) {
        Long candId = getAuthCandidateId();
        if (candId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Optional<InterviewRound> roundOpt = interviewRoundRepository.findByIdAndCandidateCandidateAccountId(id, candId);
        if (roundOpt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        String messageText = request.get("message");
        if (messageText == null || messageText.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Message text is required."));
        }

        Optional<CandidateAccount> candAccOpt = candidateAccountRepository.findById(candId);
        if (candAccOpt.isEmpty()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        InterviewChatMessage msg = InterviewChatMessage.builder()
                .interviewRound(roundOpt.get())
                .senderType("candidate")
                .senderName(candAccOpt.get().getFullName())
                .message(messageText)
                .build();

        interviewChatMessageRepository.save(msg);

        Map<String, Object> map = new HashMap<>();
        map.put("id", msg.getId());
        map.put("sender_type", msg.getSenderType());
        map.put("sender_name", msg.getSenderName());
        map.put("message", msg.getMessage());
        map.put("timestamp", msg.getTimestamp() != null ? msg.getTimestamp().toString() : null);

        return ResponseEntity.status(HttpStatus.CREATED).body(map);
    }

    @GetMapping("/interviews/{id}/presence/")
    public ResponseEntity<?> getPresence(@PathVariable("id") Long id) {
        Long candId = getAuthCandidateId();
        if (candId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Optional<InterviewRound> roundOpt = interviewRoundRepository.findByIdAndCandidateCandidateAccountId(id, candId);
        if (roundOpt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        InterviewRound round = roundOpt.get();
        boolean wasOffline = !round.isCandidateLive();
        round.setCandidateLive(true);
        round.setCandidateLastSeen(LocalDateTime.now());

        if (round.isInterviewerLive() && round.getInterviewerLastSeen() != null) {
            if (round.getInterviewerLastSeen().isBefore(LocalDateTime.now().minusSeconds(6))) {
                round.setInterviewerLive(false);
            }
        }
        interviewRoundRepository.save(round);

        if (wasOffline) {
            if (round.getInterviewer() != null) {
                notificationRepository.save(Notification.builder()
                        .recipient(round.getInterviewer())
                        .notificationType("recruitment_alert")
                        .title("Candidate Joined Lobby")
                        .message("Candidate " + round.getCandidate().getFullName() + " has joined the lobby.")
                        .relatedObjectType("InterviewRound")
                        .relatedObjectId(round.getId())
                        .status("unread")
                        .build());
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("is_candidate_live", round.isCandidateLive());
        response.put("is_interviewer_live", round.isInterviewerLive());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/interviews/{id}/presence/")
    public ResponseEntity<?> leavePresence(@PathVariable("id") Long id) {
        Long candId = getAuthCandidateId();
        if (candId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Optional<InterviewRound> roundOpt = interviewRoundRepository.findByIdAndCandidateCandidateAccountId(id, candId);
        if (roundOpt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        InterviewRound round = roundOpt.get();
        round.setCandidateLive(false);
        interviewRoundRepository.save(round);

        if (round.getInterviewer() != null) {
            notificationRepository.save(Notification.builder()
                    .recipient(round.getInterviewer())
                    .notificationType("recruitment_alert")
                    .title("Candidate Left Lobby")
                    .message("Candidate " + round.getCandidate().getFullName() + " has left the lobby.")
                    .relatedObjectType("InterviewRound")
                    .relatedObjectId(round.getId())
                    .status("unread")
                    .build());
        }

        return ResponseEntity.ok(Collections.singletonMap("message", "Successfully left lobby."));
    }

    private Map<String, Object> getCandidateAccountMap(CandidateAccount c) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", c.getId());
        map.put("email", c.getEmail());
        map.put("full_name", c.getFullName());
        map.put("phone", c.getPhone());
        map.put("location", c.getLocation());
        map.put("experience", c.getExperience());
        map.put("skills", c.getSkills());
        map.put("qualification", c.getQualification());
        map.put("resume", c.getResume());
        map.put("linkedin_url", c.getLinkedinUrl());
        map.put("portfolio_url", c.getPortfolioUrl());
        map.put("is_verified", c.isVerified());
        return map;
    }
}

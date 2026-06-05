package com.talentpulse.hrms.controller;

import com.talentpulse.hrms.model.*;
import com.talentpulse.hrms.repository.*;
import com.talentpulse.hrms.service.UserService;
import com.talentpulse.hrms.service.EmailService;
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
@RequestMapping("/api/recruitment")
public class RecruitmentController {

    @Autowired
    private JobRequisitionRepository jobRequisitionRepository;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private InterviewRoundRepository interviewRoundRepository;

    @Autowired
    private OfferLetterRepository offerLetterRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private DesignationRepository designationRepository;

    @Autowired
    private GradeStructureRepository gradeStructureRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private InterviewChatMessageRepository interviewChatMessageRepository;

    // --- JOB REQUISITIONS ---

    @GetMapping("/job-requisitions/")
    public ResponseEntity<?> listRequisitions() {
        List<JobRequisition> reqs = jobRequisitionRepository.findAll();
        List<Map<String, Object>> results = reqs.stream().map(this::getJobRequisitionMap).collect(Collectors.toList());
        return ResponseEntity.ok(results);
    }

    @PostMapping("/job-requisitions/")
    public ResponseEntity<?> createRequisition(@RequestBody Map<String, Object> request, Principal principal) {
        String title = (String) request.get("title");
        String description = (String) request.get("description");
        String deptName = (String) request.get("department");
        String desigName = (String) request.get("designation");
        BigDecimal salaryMin = request.get("salary_range_min") != null ? new BigDecimal(request.get("salary_range_min").toString()) : null;
        BigDecimal salaryMax = request.get("salary_range_max") != null ? new BigDecimal(request.get("salary_range_max").toString()) : null;

        JobRequisition req = JobRequisition.builder()
                .title(title)
                .description(description)
                .department(deptName)
                .designation(desigName)
                .salaryRangeMin(salaryMin)
                .salaryRangeMax(salaryMax)
                .status("open") // Default open for UI integration
                .build();

        if (request.get("department_ref") != null) {
            departmentRepository.findById(((Number) request.get("department_ref")).longValue()).ifPresent(req::setDepartmentRef);
        }
        if (request.get("designation_ref") != null) {
            designationRepository.findById(((Number) request.get("designation_ref")).longValue()).ifPresent(req::setDesignationRef);
        }
        if (request.get("grade") != null) {
            gradeStructureRepository.findById(((Number) request.get("grade")).longValue()).ifPresent(req::setGrade);
        }
        if (request.get("required_by") != null) {
            req.setRequiredBy(LocalDate.parse((String) request.get("required_by")));
        }

        if (principal != null) {
            userService.findByUsername(principal.getName()).ifPresent(req::setCreatedBy);
        }

        jobRequisitionRepository.save(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(getJobRequisitionMap(req));
    }

    // --- CANDIDATES ---

    @GetMapping("/candidates/")
    public ResponseEntity<?> listCandidates() {
        List<Candidate> candidates = candidateRepository.findAll();
        List<Map<String, Object>> results = candidates.stream().map(this::getCandidateMap).collect(Collectors.toList());
        return ResponseEntity.ok(results);
    }

    @PostMapping("/candidates/")
    public ResponseEntity<?> createCandidate(@RequestBody Map<String, Object> request) {
        Long reqId = ((Number) request.get("job_requisition")).longValue();
        Optional<JobRequisition> reqOpt = jobRequisitionRepository.findById(reqId);
        if (reqOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Job requisition not found"));
        }

        Candidate cand = Candidate.builder()
                .jobRequisition(reqOpt.get())
                .firstName((String) request.get("first_name"))
                .lastName((String) request.get("last_name"))
                .email((String) request.get("email"))
                .phone((String) request.get("phone"))
                .currentCompany((String) request.get("current_company"))
                .currentDesignation((String) request.get("current_designation"))
                .coverLetter((String) request.get("cover_letter"))
                .status("applied")
                .build();

        candidateRepository.save(cand);
        return ResponseEntity.status(HttpStatus.CREATED).body(getCandidateMap(cand));
    }

    // --- INTERVIEW ROUNDS ---

    @GetMapping("/interview-rounds/")
    public ResponseEntity<?> listInterviews() {
        List<InterviewRound> rounds = interviewRoundRepository.findAll();
        List<Map<String, Object>> results = rounds.stream().map(this::getInterviewRoundMap).collect(Collectors.toList());
        return ResponseEntity.ok(results);
    }

    @PostMapping("/interview-rounds/")
    public ResponseEntity<?> scheduleInterview(@RequestBody Map<String, Object> request, Principal principal) {
        Long candId = ((Number) request.get("candidate")).longValue();
        Optional<Candidate> candOpt = candidateRepository.findById(candId);
        if (candOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Candidate not found"));
        }

        InterviewRound round = InterviewRound.builder()
                .candidate(candOpt.get())
                .requisition(candOpt.get().getJobRequisition())
                .interviewType((String) request.get("interview_type"))
                .scheduledDate(LocalDateTime.parse((String) request.get("scheduled_date")))
                .status("scheduled")
                .outcome("pending")
                .meetingLink((String) request.get("meeting_link"))
                .build();

        if (request.get("interviewer") != null) {
            userService.findById(((Number) request.get("interviewer")).longValue()).ifPresent(round::setInterviewer);
        }
        if (principal != null) {
            userService.findByUsername(principal.getName()).ifPresent(round::setCreatedBy);
        }

        interviewRoundRepository.save(round);

        // Update candidate status
        Candidate candidate = candOpt.get();
        candidate.setStatus("interview_scheduled");
        candidateRepository.save(candidate);

        return ResponseEntity.status(HttpStatus.CREATED).body(getInterviewRoundMap(round));
    }

    @RequestMapping(value = "/interview-rounds/{id}/", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<?> updateInterviewOutcome(@PathVariable("id") Long id, @RequestBody Map<String, Object> request) {
        Optional<InterviewRound> roundOpt = interviewRoundRepository.findById(id);
        if (roundOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        InterviewRound round = roundOpt.get();
        LocalDateTime oldDate = round.getScheduledDate();

        if (request.containsKey("status")) {
            round.setStatus((String) request.get("status"));
        }
        if (request.containsKey("outcome")) {
            round.setOutcome((String) request.get("outcome"));
        }
        if (request.containsKey("feedback")) {
            round.setFeedback((String) request.get("feedback"));
        }
        if (request.containsKey("rating")) {
            round.setRating(((Number) request.get("rating")).intValue());
        }
        if (request.containsKey("meeting_link")) {
            round.setMeetingLink((String) request.get("meeting_link"));
        }
        if (request.containsKey("scheduled_date")) {
            round.setScheduledDate(LocalDateTime.parse((String) request.get("scheduled_date")));
        }

        if (request.containsKey("communication_rating")) round.setCommunicationRating(((Number) request.get("communication_rating")).intValue());
        if (request.containsKey("confidence_rating")) round.setConfidenceRating(((Number) request.get("confidence_rating")).intValue());
        if (request.containsKey("professionalism_rating")) round.setProfessionalismRating(((Number) request.get("professionalism_rating")).intValue());
        if (request.containsKey("cultural_fit_rating")) round.setCulturalFitRating(((Number) request.get("cultural_fit_rating")).intValue());
        if (request.containsKey("problem_solving_rating")) round.setProblemSolvingRating(((Number) request.get("problem_solving_rating")).intValue());
        if (request.containsKey("tech_knowledge_rating")) round.setTechKnowledgeRating(((Number) request.get("tech_knowledge_rating")).intValue());
        if (request.containsKey("coding_rating")) round.setCodingRating(((Number) request.get("coding_rating")).intValue());
        if (request.containsKey("project_experience_rating")) round.setProjectExperienceRating(((Number) request.get("project_experience_rating")).intValue());
        if (request.containsKey("system_design_rating")) round.setSystemDesignRating(((Number) request.get("system_design_rating")).intValue());

        interviewRoundRepository.save(round);

        if (oldDate != null && round.getScheduledDate() != null && !oldDate.equals(round.getScheduledDate())) {
            try {
                String dateStr = round.getScheduledDate().toLocalDate().toString();
                String timeStr = round.getScheduledDate().toLocalTime().toString();
                String jobTitle = round.getRequisition() != null ? round.getRequisition().getTitle() : "General Requisition";
                String interviewerName = round.getInterviewer() != null ? round.getInterviewer().getFullName() : "HR Representative";

                emailService.sendInterviewRescheduled(
                        round.getCandidate().getEmail(),
                        round.getCandidate().getFullName(),
                        jobTitle,
                        round.getInterviewType(),
                        dateStr,
                        timeStr,
                        round.getMeetingLink() != null ? round.getMeetingLink() : "https://meet.google.com/mock-meet",
                        interviewerName
                );
            } catch (Exception e) {
                System.err.println("Error triggering rescheduled email: " + e.getMessage());
            }
        }

        if ("completed".equalsIgnoreCase(round.getStatus())) {
            Candidate cand = round.getCandidate();
            if ("fail".equalsIgnoreCase(round.getOutcome())) {
                cand.setStatus("rejected");
                candidateRepository.save(cand);
            } else if ("pass".equalsIgnoreCase(round.getOutcome())) {
                String nextStatus = "hr".equalsIgnoreCase(round.getInterviewType()) ? "selected" : "shortlisted";
                cand.setStatus(nextStatus);
                candidateRepository.save(cand);

                try {
                    String jobTitle = round.getRequisition() != null ? round.getRequisition().getTitle() : "General Requisition";
                    if ("shortlisted".equals(nextStatus)) {
                        emailService.sendShortlistNotification(cand.getEmail(), cand.getFullName(), jobTitle);
                    } else if ("selected".equals(nextStatus)) {
                        emailService.sendSelectionNotification(cand.getEmail(), cand.getFullName(), jobTitle);
                    }
                } catch (Exception e) {
                    System.err.println("Error sending interview success email: " + e.getMessage());
                }
            }
        }

        return ResponseEntity.ok(getInterviewRoundMap(round));
    }

    @RequestMapping(value = "/candidates/{id}/", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<?> updateCandidate(@PathVariable("id") Long id, @RequestBody Map<String, Object> request) {
        Optional<Candidate> candOpt = candidateRepository.findById(id);
        if (candOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Candidate cand = candOpt.get();

        if (request.containsKey("first_name")) cand.setFirstName((String) request.get("first_name"));
        if (request.containsKey("last_name")) cand.setLastName((String) request.get("last_name"));
        if (request.containsKey("email")) cand.setEmail((String) request.get("email"));
        if (request.containsKey("phone")) cand.setPhone((String) request.get("phone"));
        if (request.containsKey("current_company")) cand.setCurrentCompany((String) request.get("current_company"));
        if (request.containsKey("current_designation")) cand.setCurrentDesignation((String) request.get("current_designation"));
        if (request.containsKey("cover_letter")) cand.setCoverLetter((String) request.get("cover_letter"));
        if (request.containsKey("status")) cand.setStatus((String) request.get("status"));
        if (request.containsKey("resume")) cand.setResume((String) request.get("resume"));

        candidateRepository.save(cand);
        return ResponseEntity.ok(getCandidateMap(cand));
    }

    @PostMapping("/interview-rounds/{id}/join_room/")
    public ResponseEntity<?> joinRoom(@PathVariable("id") Long id, Principal principal) {
        Optional<InterviewRound> roundOpt = interviewRoundRepository.findById(id);
        if (roundOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        InterviewRound round = roundOpt.get();
        boolean wasOffline = !round.isInterviewerLive();
        round.setInterviewerLive(true);
        round.setInterviewerLastSeen(LocalDateTime.now());

        if (round.isCandidateLive() && round.getCandidateLastSeen() != null) {
            if (round.getCandidateLastSeen().isBefore(LocalDateTime.now().minusSeconds(6))) {
                round.setCandidateLive(false);
            }
        }

        interviewRoundRepository.save(round);

        if (wasOffline && principal != null) {
            Optional<User> reqUserOpt = userService.findByUsername(principal.getName());
            if (reqUserOpt.isPresent() && round.getCreatedBy() != null && !round.getCreatedBy().getId().equals(reqUserOpt.get().getId())) {
                notificationRepository.save(Notification.builder()
                        .recipient(round.getCreatedBy())
                        .notificationType("recruitment_alert")
                        .title("Interviewer Joined Lobby")
                        .message("Interviewer " + reqUserOpt.get().getFullName() + " has joined the lobby for candidate " + round.getCandidate().getFullName() + ".")
                        .relatedObjectType("InterviewRound")
                        .relatedObjectId(round.getId())
                        .status("unread")
                        .build());
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Successfully joined room.");
        response.put("is_candidate_live", round.isCandidateLive());
        response.put("is_interviewer_live", round.isInterviewerLive());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/interview-rounds/{id}/leave_room/")
    public ResponseEntity<?> leaveRoom(@PathVariable("id") Long id, Principal principal) {
        Optional<InterviewRound> roundOpt = interviewRoundRepository.findById(id);
        if (roundOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        InterviewRound round = roundOpt.get();
        round.setInterviewerLive(false);
        interviewRoundRepository.save(round);

        if (principal != null && round.getCreatedBy() != null) {
            Optional<User> reqUserOpt = userService.findByUsername(principal.getName());
            if (reqUserOpt.isPresent()) {
                notificationRepository.save(Notification.builder()
                        .recipient(round.getCreatedBy())
                        .notificationType("recruitment_alert")
                        .title("Interviewer Left Lobby")
                        .message("Interviewer " + reqUserOpt.get().getFullName() + " has left the lobby.")
                        .relatedObjectType("InterviewRound")
                        .relatedObjectId(round.getId())
                        .status("unread")
                        .build());
            }
        }

        return ResponseEntity.ok(Collections.singletonMap("message", "Successfully left room."));
    }

    @GetMapping("/interview-rounds/{id}/chat/")
    public ResponseEntity<?> getChatMessages(@PathVariable("id") Long id) {
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

    @PostMapping("/interview-rounds/{id}/chat/")
    public ResponseEntity<?> postChatMessage(@PathVariable("id") Long id, @RequestBody Map<String, String> request, Principal principal) {
        Optional<InterviewRound> roundOpt = interviewRoundRepository.findById(id);
        if (roundOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String messageText = request.get("message");
        if (messageText == null || messageText.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Message text is required."));
        }

        String senderName = "Interviewer";
        if (principal != null) {
            Optional<User> reqUserOpt = userService.findByUsername(principal.getName());
            if (reqUserOpt.isPresent()) {
                senderName = reqUserOpt.get().getFullName();
            }
        }

        InterviewChatMessage msg = InterviewChatMessage.builder()
                .interviewRound(roundOpt.get())
                .senderType("interviewer")
                .senderName(senderName)
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

    // --- OFFER LETTERS ---

    @GetMapping("/offer-letters/")
    public ResponseEntity<?> listOffers() {
        List<OfferLetter> offers = offerLetterRepository.findAll();
        List<Map<String, Object>> results = offers.stream().map(this::getOfferLetterMap).collect(Collectors.toList());
        return ResponseEntity.ok(results);
    }

    @PostMapping("/offer-letters/")
    public ResponseEntity<?> createOffer(@RequestBody Map<String, Object> request) {
        Long candId = ((Number) request.get("candidate")).longValue();
        Optional<Candidate> candOpt = candidateRepository.findById(candId);
        if (candOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Candidate not found"));
        }

        BigDecimal salary = new BigDecimal(request.get("salary").toString());
        LocalDate startDate = LocalDate.parse((String) request.get("start_date"));
        LocalDate validity = LocalDate.parse((String) request.get("offer_validity"));

        OfferLetter offer = OfferLetter.builder()
                .candidate(candOpt.get())
                .requisition(candOpt.get().getJobRequisition())
                .positionTitle((String) request.getOrDefault("position_title", candOpt.get().getJobRequisition().getTitle()))
                .salary(salary)
                .startDate(startDate)
                .offerValidity(validity)
                .status("sent") // Released
                .build();

        offerLetterRepository.save(offer);

        // Update candidate
        Candidate candidate = candOpt.get();
        candidate.setStatus("offered");
        candidateRepository.save(candidate);

        return ResponseEntity.status(HttpStatus.CREATED).body(getOfferLetterMap(offer));
    }

    private Map<String, Object> getJobRequisitionMap(JobRequisition j) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", j.getId());
        map.put("title", j.getTitle());
        map.put("description", j.getDescription());
        map.put("department", j.getDepartment());
        map.put("designation", j.getDesignation());
        map.put("position_count", j.getPositionCount());
        map.put("salary_range_min", j.getSalaryRangeMin());
        map.put("salary_range_max", j.getSalaryRangeMax());
        map.put("status", j.getStatus());
        map.put("required_by", j.getRequiredBy() != null ? j.getRequiredBy().toString() : null);
        return map;
    }

    private Map<String, Object> getCandidateMap(Candidate c) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", c.getId());
        map.put("job_requisition", c.getJobRequisition().getId());
        map.put("first_name", c.getFirstName());
        map.put("last_name", c.getLastName());
        map.put("email", c.getEmail());
        map.put("phone", c.getPhone());
        map.put("current_company", c.getCurrentCompany());
        map.put("current_designation", c.getCurrentDesignation());
        map.put("resume", c.getResume());
        map.put("cover_letter", c.getCoverLetter());
        map.put("status", c.getStatus());
        map.put("applied_date", c.getAppliedDate() != null ? c.getAppliedDate().toString() : null);
        return map;
    }

    private Map<String, Object> getInterviewRoundMap(InterviewRound r) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", r.getId());
        map.put("candidate", r.getCandidate().getId());
        map.put("candidate_name", r.getCandidate().getFullName());
        map.put("interview_type", r.getInterviewType());
        map.put("interviewer", r.getInterviewer() != null ? r.getInterviewer().getId() : null);
        map.put("interviewer_name", r.getInterviewer() != null ? r.getInterviewer().getFullName() : null);
        map.put("scheduled_date", r.getScheduledDate() != null ? r.getScheduledDate().toString() : null);
        map.put("status", r.getStatus());
        map.put("outcome", r.getOutcome());
        map.put("feedback", r.getFeedback());
        map.put("rating", r.getRating());
        map.put("meeting_link", r.getMeetingLink());
        
        map.put("communication_rating", r.getCommunicationRating());
        map.put("confidence_rating", r.getConfidenceRating());
        map.put("professionalism_rating", r.getProfessionalismRating());
        map.put("cultural_fit_rating", r.getCulturalFitRating());
        map.put("problem_solving_rating", r.getProblemSolvingRating());
        map.put("tech_knowledge_rating", r.getTechKnowledgeRating());
        map.put("coding_rating", r.getCodingRating());
        map.put("project_experience_rating", r.getProjectExperienceRating());
        map.put("system_design_rating", r.getSystemDesignRating());
        
        return map;
    }

    private Map<String, Object> getOfferLetterMap(OfferLetter o) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", o.getId());
        map.put("candidate", o.getCandidate().getId());
        map.put("candidate_name", o.getCandidate().getFullName());
        map.put("position_title", o.getPositionTitle());
        map.put("salary", o.getSalary());
        map.put("start_date", o.getStartDate() != null ? o.getStartDate().toString() : null);
        map.put("offer_validity", o.getOfferValidity() != null ? o.getOfferValidity().toString() : null);
        map.put("status", o.getStatus());
        return map;
    }
}

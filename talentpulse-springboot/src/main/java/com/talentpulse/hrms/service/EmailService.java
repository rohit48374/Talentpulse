package com.talentpulse.hrms.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.logging.Level;
import java.util.logging.Logger;

@Service
public class EmailService {

    private static final Logger LOGGER = Logger.getLogger(EmailService.class.getName());

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@hirevant.com}")
    private String fromEmail;

    @Value("${app.candidate-portal-url}")
    private String candidatePortalUrl;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    private static final String BASE_EMAIL_TEMPLATE = 
        "<!DOCTYPE html>" +
        "<html>" +
        "<head>" +
        "    <meta charset=\"utf-8\">" +
        "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
        "    <title>%s</title>" +
        "    <style>" +
        "        body { font-family: 'Inter', sans-serif; background-color: #f6f9fc; color: #333333; margin: 0; padding: 0; }" +
        "        .wrapper { width: 100%%; background-color: #f6f9fc; padding: 40px 0; }" +
        "        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(79,70,229,0.05); border: 1px solid #eef2f6; }" +
        "        .header { background: linear-gradient(135deg, #6345ED 0%%, #4F46E5 100%%); padding: 40px; text-align: center; color: #ffffff; }" +
        "        .header h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }" +
        "        .header p { margin: 8px 0 0 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.8); }" +
        "        .content { padding: 40px; line-height: 1.6; font-size: 15px; color: #4b5563; }" +
        "        .content h2 { color: #1f2937; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 16px; }" +
        "        .content p { margin-top: 0; margin-bottom: 16px; }" +
        "        .highlight-box { background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 16px; padding: 24px; margin: 24px 0; }" +
        "        .highlight-box h3 { margin-top: 0; color: #6345ED; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }" +
        "        .highlight-box p { margin-bottom: 8px; font-size: 13.5px; }" +
        "        .highlight-box p:last-child { margin-bottom: 0; }" +
        "        .otp-box { font-size: 32px; font-weight: 900; color: #6345ED; letter-spacing: 6px; text-align: center; background: #ffffff; border: 2px dashed #ddd6fe; padding: 16px; border-radius: 12px; margin: 20px auto; max-width: 240px; }" +
        "        .btn { display: inline-block; background: linear-gradient(135deg, #6345ED 0%%, #4F46E5 100%%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 16px; font-size: 14px; font-weight: 900; text-align: center; margin: 24px 0; box-shadow: 0 4px 12px rgba(99,69,237,0.2); }" +
        "        .footer { padding: 32px 40px; background-color: #fafbfd; border-top: 1px solid #f3f4f6; text-align: center; font-size: 12px; color: #9ca3af; }" +
        "        .badge { display: inline-block; padding: 4px 12px; border-radius: 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; }" +
        "        .badge-success { background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }" +
        "        .badge-info { background-color: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }" +
        "    </style>" +
        "</head>" +
        "<body>" +
        "    <div class=\"wrapper\">" +
        "        <div class=\"container\">" +
        "            <div class=\"header\">" +
        "                <h1>Hirevant</h1>" +
        "                <p>Enterprise HR Solutions</p>" +
        "            </div>" +
        "            <div class=\"content\">" +
        "                %s" +
        "            </div>" +
        "            <div class=\"footer\">" +
        "                <p>&copy; 2026 Hirevant Inc. All rights reserved.</p>" +
        "                <p>Global Headquarters: Tech Hub Plaza, Floor 14, Bengaluru, India</p>" +
        "                <p>This is an operational notification. Please do not reply directly to this email.</p>" +
        "            </div>" +
        "        </div>" +
        "    </div>" +
        "</body>" +
        "</html>";

    private boolean sendHtmlEmail(String subject, String recipientEmail, String bodyHtml) {
        if (mailSender == null) {
            LOGGER.log(Level.WARNING, "SMTP JavaMailSender not configured. Skipping sending email to {0}: {1}", new Object[]{recipientEmail, subject});
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(recipientEmail);
            helper.setFrom(fromEmail);
            helper.setSubject(subject);

            String fullHtml = String.format(BASE_EMAIL_TEMPLATE, subject, bodyHtml);
            helper.setText(fullHtml, true);

            mailSender.send(message);
            LOGGER.log(Level.INFO, "Email sent successfully to {0}: {1}", new Object[]{recipientEmail, subject});
            return true;
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Failed to send email to " + recipientEmail + " (Subject: " + subject + ")", e);
            return false;
        }
    }

    @Async
    public void sendVerificationEmail(String candidateEmail, String fullName, String token, String otp) {
        String verifyUrl = candidatePortalUrl + "/verify-email?token=" + token + "&email=" + candidateEmail;
        String html = "<h2>Verify Your Email Address</h2>" +
                "<p>Dear " + fullName + ",</p>" +
                "<p>Thank you for registering at Hirevant Careers Portal! To start applying for open positions, please verify your email address.</p>" +
                "<p>You can verify your email using either of the following professional secure methods:</p>" +
                "<div class=\"highlight-box\">" +
                "    <h3>Method A: Enter 6-Digit OTP</h3>" +
                "    <p>Input this verification code directly in your browser:</p>" +
                "    <div class=\"otp-box\">" + otp + "</div>" +
                "</div>" +
                "<div style=\"text-align: center;\">" +
                "    <p><strong>Method B: Verification Link</strong></p>" +
                "    <a href=\"" + verifyUrl + "\" class=\"btn\">Verify Account Instantly</a>" +
                "</div>";
        sendHtmlEmail("Welcome to Hirevant - Verify Your Email", candidateEmail, html);
    }

    @Async
    public void sendApplicationConfirmation(String candidateEmail, String fullName, String jobTitle) {
        String html = "<h2>Application Received</h2>" +
                "<p>Dear " + fullName + ",</p>" +
                "<p>We are delighted to confirm that your job application for the position of <strong>" + jobTitle + "</strong> has been successfully received.</p>" +
                "<div class=\"highlight-box\">" +
                "    <h3>Application Summary</h3>" +
                "    <p><strong>Position:</strong> " + jobTitle + "</p>" +
                "    <p><strong>Status:</strong> <span class=\"badge badge-info\">Applied / Under Review</span></p>" +
                "</div>";
        sendHtmlEmail("Application Received: " + jobTitle + " - Hirevant", candidateEmail, html);
    }

    @Async
    public void sendRecruiterNewApplicationAlert(String recruiterEmail, String candidateName, String candidateEmail, String jobTitle) {
        String html = "<h2>New Job Application Received</h2>" +
                "<p>Hello Recruiter,</p>" +
                "<p>A new candidate has submitted an application for the open position: <strong>" + jobTitle + "</strong>.</p>" +
                "<div class=\"highlight-box\">" +
                "    <h3>Applicant Details</h3>" +
                "    <p><strong>Name:</strong> " + candidateName + "</p>" +
                "    <p><strong>Email:</strong> " + candidateEmail + "</p>" +
                "</div>" +
                "<a href=\"" + frontendUrl + "/recruitment\" class=\"btn\">Review Application</a>";
        sendHtmlEmail("New Application Alert: " + candidateName + " - " + jobTitle, recruiterEmail, html);
    }

    @Async
    public void sendShortlistNotification(String candidateEmail, String fullName, String jobTitle) {
        String html = "<h2>Congratulations! You are Shortlisted</h2>" +
                "<p>Dear " + fullName + ",</p>" +
                "<p>We have exciting news! After evaluating your profile and resume, our hiring panel has officially **shortlisted** you for the **" + jobTitle + "** position.</p>" +
                "<div class=\"highlight-box\">" +
                "    <h3>Candidate Stage Status</h3>" +
                "    <p><strong>Requisition:</strong> " + jobTitle + "</p>" +
                "    <p><strong>Stage:</strong> <span class=\"badge badge-success\">Shortlisted / Under Evaluation</span></p>" +
                "</div>";
        sendHtmlEmail("Congratulations! You are shortlisted for " + jobTitle, candidateEmail, html);
    }

    @Async
    public void sendInterviewInvitation(String candidateEmail, String fullName, String jobTitle, String interviewType, String dateStr, String timeStr, String meetingLink, String interviewerName) {
        String html = "<h2>Interview Invitation: " + interviewType + " Round</h2>" +
                "<p>Dear " + fullName + ",</p>" +
                "<p>You have been scheduled for a live interview round for the position of <strong>" + jobTitle + "</strong>.</p>" +
                "<div class=\"highlight-box\">" +
                "    <h3>Meeting Details</h3>" +
                "    <p><strong>Date:</strong> " + dateStr + "</p>" +
                "    <p><strong>Time:</strong> " + timeStr + "</p>" +
                "    <p><strong>Interview Type:</strong> " + interviewType + " Round</p>" +
                "    <p><strong>Interviewer:</strong> " + interviewerName + "</p>" +
                "    <p><strong>Meeting Lobby URL:</strong> <a href=\"" + meetingLink + "\">" + meetingLink + "</a></p>" +
                "</div>";
        sendHtmlEmail("Interview Scheduled: " + interviewType + " Round - " + jobTitle, candidateEmail, html);
    }

    @Async
    public void sendInterviewerAssignmentAlert(String interviewerEmail, String interviewerName, String candidateName, String jobTitle, String interviewType, String dateStr, String timeStr, String meetingLink) {
        String html = "<h2>Interview Conducting Assignment: " + interviewType + " Round</h2>" +
                "<p>Dear " + interviewerName + ",</p>" +
                "<p>You have been assigned as the primary interviewer for **" + candidateName + "** applying for the position **" + jobTitle + "**.</p>" +
                "<div class=\"highlight-box\">" +
                "    <h3>Assignment Schedule</h3>" +
                "    <p><strong>Applicant Name:</strong> " + candidateName + "</p>" +
                "    <p><strong>Interview Type:</strong> " + interviewType + " Round</p>" +
                "    <p><strong>Date:</strong> " + dateStr + "</p>" +
                "    <p><strong>Time:</strong> " + timeStr + "</p>" +
                "    <p><strong>Meeting Link:</strong> <a href=\"" + meetingLink + "\">" + meetingLink + "</a></p>" +
                "</div>";
        sendHtmlEmail("Interview Assignment: " + candidateName + " - " + interviewType + " Round", interviewerEmail, html);
    }

    @Async
    public void sendInterviewRescheduled(String candidateEmail, String fullName, String jobTitle, String interviewType, String dateStr, String timeStr, String meetingLink, String interviewerName) {
        String html = "<h2>RESCHEDULED: Updated Interview Invitation</h2>" +
                "<p>Dear " + fullName + ",</p>" +
                "<p>Please note that your scheduled **" + interviewType + "** round for **" + jobTitle + "** has been rescheduled.</p>" +
                "<div class=\"highlight-box\">" +
                "    <h3>New Meeting Schedule</h3>" +
                "    <p><strong>Date:</strong> " + dateStr + "</p>" +
                "    <p><strong>Time:</strong> " + timeStr + "</p>" +
                "    <p><strong>Interviewer:</strong> " + interviewerName + "</p>" +
                "    <p><strong>Meeting Link:</strong> <a href=\"" + meetingLink + "\">" + meetingLink + "</a></p>" +
                "</div>";
        sendHtmlEmail("Updated Schedule: " + interviewType + " Round - " + jobTitle, candidateEmail, html);
    }

    @Async
    public void sendSelectionNotification(String candidateEmail, String fullName, String jobTitle) {
        String html = "<h2>Congratulations! You Are Selected</h2>" +
                "<p>Dear " + fullName + ",</p>" +
                "<p>We are absolutely thrilled to inform you that following your interviews, the hiring panel has **selected** you for employment!</p>" +
                "<div class=\"highlight-box\">" +
                "    <h3>Selection Details</h3>" +
                "    <p><strong>Position:</strong> " + jobTitle + "</p>" +
                "    <p><strong>Decision:</strong> <span class=\"badge badge-success\">Selected for Hire</span></p>" +
                "</div>";
        sendHtmlEmail("Congratulations! You are selected for " + jobTitle, candidateEmail, html);
    }

    @Async
    public void sendOfferLetter(String candidateEmail, String fullName, String jobTitle, String salary, String startDate, String validityDate) {
        String html = "<h2>Your Employment Offer is Released</h2>" +
                "<p>Dear " + fullName + ",</p>" +
                "<p>We are delighted to formally offer you employment for the position of <strong>" + jobTitle + "</strong>!</p>" +
                "<div class=\"highlight-box\">" +
                "    <h3>Compensation & Offer Metrics</h3>" +
                "    <p><strong>Annual Package:</strong> INR " + salary + "</p>" +
                "    <p><strong>Joining Date:</strong> " + startDate + "</p>" +
                "    <p><strong>Offer Validity Until:</strong> " + validityDate + "</p>" +
                "</div>" +
                "<a href=\"" + candidatePortalUrl + "/dashboard\" class=\"btn\">View Offer Letter</a>";
        sendHtmlEmail("Employment Offer Released: " + jobTitle + " - Hirevant", candidateEmail, html);
    }

    @Async
    public void sendWelcomeEmail(String candidateEmail, String fullName, String jobTitle, String startDate) {
        String html = "<h2>Welcome to our Team! Offer Accepted</h2>" +
                "<p>Dear " + fullName + ",</p>" +
                "<p>We are thrilled to receive your formal acceptance of our employment offer! We are excited to have you join us starting on <strong>" + startDate + "</strong>.</p>";
        sendHtmlEmail("Welcome to Hirevant! Offer Formally Accepted", candidateEmail, html);
    }

    @Async
    public void sendHrOfferAcceptedAlert(String hrEmail, String candidateName, String candidateEmail, String jobTitle, String startDate) {
        String html = "<h2>Action Required: Offer Formally Accepted</h2>" +
                "<p>Dear HR Administrator,</p>" +
                "<p>Candidate **" + candidateName + "** (" + candidateEmail + ") has formally accepted the employment offer for **" + jobTitle + "**.</p>" +
                "<div class=\"highlight-box\">" +
                "    <h3>Next Steps Onboarding</h3>" +
                "    <p><strong>Candidate:</strong> " + candidateName + "</p>" +
                "    <p><strong>Expected Start Date:</strong> " + startDate + "</p>" +
                "</div>";
        sendHtmlEmail("Offer Accepted Alert: " + candidateName + " - " + jobTitle, hrEmail, html);
    }

    @Async
    public void sendCredentialsEmail(String employeeEmail, String fullName, String username, String tempPassword) {
        String html = "<h2>Your Hirevant HRMS Account is Active</h2>" +
                "<p>Dear " + fullName + ",</p>" +
                "<p>Your secure corporate employee account for the Hirevant Portal has been successfully generated.</p>" +
                "<div class=\"highlight-box\">" +
                "    <h3>Secure Log-in Credentials</h3>" +
                "    <p><strong>Portal URL:</strong> <a href=\"" + frontendUrl + "/login\">" + frontendUrl + "/login</a></p>" +
                "    <p><strong>Username / Email ID:</strong> " + username + "</p>" +
                "    <p><strong>Temporary Password:</strong> <code style=\"font-weight:bold; background:#e0f2fe; padding:2px 6px; border-radius:4px;\">" + tempPassword + "</code></p>" +
                "</div>" +
                "<p style=\"color:#dc2626; font-size:12px; font-weight:bold;\">Important: You will be required to update your temporary password immediately upon your first login.</p>";
        sendHtmlEmail("Corporate Account Generated - Hirevant HRMS", employeeEmail, html);
    }

    @Async
    public void sendPasswordResetEmail(String userEmail, String fullName, String otp) {
        String resetUrl = frontendUrl + "/reset-password?token=" + otp + "&email=" + userEmail;
        String html = "<h2>Password Reset Request</h2>" +
                "<p>Dear " + fullName + ",</p>" +
                "<p>We received a request to reset your Hirevant HRMS portal password.</p>" +
                "<div class=\"highlight-box\">" +
                "    <h3>Method A: One-Click Reset Link</h3>" +
                "    <p>Click the button below to instantly navigate to the secure password update screen:</p>" +
                "    <div style=\"text-align: center;\">" +
                "        <a href=\"" + resetUrl + "\" class=\"btn\">Reset Password Instantly</a>" +
                "    </div>" +
                "</div>" +
                "<div class=\"highlight-box\">" +
                "    <h3>Method B: Enter 6-Digit Code</h3>" +
                "    <p>Input this verification code manually in your browser:</p>" +
                "    <div class=\"otp-box\">" + otp + "</div>" +
                "</div>";
        sendHtmlEmail("Password Reset OTP Verification Code", userEmail, html);
    }

    @Async
    public void sendLeaveApproved(String employeeEmail, String fullName, String leaveType, String startDate, String endDate, String managerName) {
        String html = "<h2>Leave Application APPROVED</h2>" +
                "<p>Dear " + fullName + ",</p>" +
                "<p>Your request for leave has been successfully evaluated and **APPROVED** by your reporting manager.</p>" +
                "<div class=\"highlight-box\">" +
                "    <h3>Leave Detail Metrics</h3>" +
                "    <p><strong>Type:</strong> " + leaveType + "</p>" +
                "    <p><strong>Duration:</strong> " + startDate + " to " + endDate + "</p>" +
                "    <p><strong>Approved By:</strong> " + managerName + "</p>" +
                "    <p><strong>Status:</strong> <span class=\"badge badge-success\">Approved / Logged</span></p>" +
                "</div>";
        sendHtmlEmail("Leave Application Approved - Hirevant", employeeEmail, html);
    }

    @Async
    public void sendLeaveRejected(String employeeEmail, String fullName, String leaveType, String startDate, String endDate, String managerName, String remarks) {
        String html = "<h2>Leave Application REJECTED</h2>" +
                "<p>Dear " + fullName + ",</p>" +
                "<p>Your leave request was evaluated by your manager and has been **DECLINED** due to business constraints:</p>" +
                "<div class=\"highlight-box\">" +
                "    <h3>Leave Metrics</h3>" +
                "    <p><strong>Type:</strong> " + leaveType + "</p>" +
                "    <p><strong>Duration:</strong> " + startDate + " to " + endDate + "</p>" +
                "    <p><strong>Declined By:</strong> " + managerName + "</p>" +
                "    <p><strong>Manager Remarks:</strong> \"" + remarks + "\"</p>" +
                "</div>";
        sendHtmlEmail("Leave Application Declined - Hirevant", employeeEmail, html);
    }

    @Async
    public void sendPayslipNotification(String employeeEmail, String fullName, String monthYear, String netSalary) {
        String html = "<h2>Your Monthly Payslip is Available</h2>" +
                "<p>Dear " + fullName + ",</p>" +
                "<p>Your official salary slip for the payroll month <strong>" + monthYear + "</strong> has been processed.</p>" +
                "<div class=\"highlight-box\">" +
                "    <h3>Payroll Summary</h3>" +
                "    <p><strong>Period:</strong> " + monthYear + "</p>" +
                "    <p><strong>Net Credit:</strong> INR " + netSalary + "</p>" +
                "</div>" +
                "<a href=\"" + frontendUrl + "/payroll\" class=\"btn\">View Payslip Portal</a>";
        sendHtmlEmail("Salary Payslip Issued: " + monthYear + " - Hirevant", employeeEmail, html);
    }

    @Async
    public void sendAppraisalCompleted(String employeeEmail, String fullName, String cycleName, String rating, String remarks) {
        String html = "<h2>Performance Evaluation Appraisal Completed</h2>" +
                "<p>Dear " + fullName + ",</p>" +
                "<p>Your performance appraisal cycle for **" + cycleName + "** has been officially completed.</p>" +
                "<div class=\"highlight-box\">" +
                "    <h3>Evaluation Rating Summary</h3>" +
                "    <p><strong>Cycle:</strong> " + cycleName + "</p>" +
                "    <p><strong>Overall Score:</strong> " + rating + " / 5</p>" +
                "    <p><strong>Feedback Remarks:</strong> \"" + remarks + "\"</p>" +
                "</div>";
        sendHtmlEmail("Performance Appraisal Finalized: " + cycleName, employeeEmail, html);
    }
}

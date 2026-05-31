# NOTIFICATIONS MODULE - emails.py
import re
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Premium, modern glassmorphic and high-fidelity branded base HTML email template
BASE_EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{subject}</title>
    <style>
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f6f9fc;
            color: #333333;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }}
        .wrapper {{
            width: 100%;
            background-color: #f6f9fc;
            padding: 40px 0;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(79, 70, 229, 0.05);
            border: 1px solid #eef2f6;
        }}
        .header {{
            background: linear-gradient(135deg, #6345ED 0%, #4F46E5 100%);
            padding: 40px;
            text-align: center;
            color: #ffffff;
            position: relative;
        }}
        .header h1 {{
            margin: 0;
            font-size: 28px;
            font-weight: 900;
            letter-spacing: -0.5px;
        }}
        .header p {{
            margin: 8px 0 0 0;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: rgba(255, 255, 255, 0.8);
        }}
        .content {{
            padding: 40px;
            line-height: 1.6;
            font-size: 15px;
            color: #4b5563;
        }}
        .content h2 {{
            color: #1f2937;
            font-size: 20px;
            font-weight: 800;
            margin-top: 0;
            margin-bottom: 16px;
        }}
        .content p {{
            margin-top: 0;
            margin-bottom: 16px;
        }}
        .highlight-box {{
            background-color: #f5f3ff;
            border: 1px solid #ddd6fe;
            border-radius: 16px;
            padding: 24px;
            margin: 24px 0;
        }}
        .highlight-box h3 {{
            margin-top: 0;
            color: #6345ED;
            font-size: 14px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        .highlight-box p {{
            margin-bottom: 8px;
            font-size: 13.5px;
        }}
        .highlight-box p:last-child {{
            margin-bottom: 0;
        }}
        .otp-box {{
            font-size: 32px;
            font-weight: 900;
            color: #6345ED;
            letter-spacing: 6px;
            text-align: center;
            background: #ffffff;
            border: 2px dashed #ddd6fe;
            padding: 16px;
            border-radius: 12px;
            margin: 20px auto;
            max-width: 240px;
        }}
        .btn {{
            display: inline-block;
            background: linear-gradient(135deg, #6345ED 0%, #4F46E5 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 16px;
            font-size: 14px;
            font-weight: 900;
            text-align: center;
            margin: 24px 0;
            box-shadow: 0 4px 12px rgba(99, 69, 237, 0.2);
            transition: all 0.3s ease;
        }}
        .btn:hover {{
            box-shadow: 0 6px 20px rgba(99, 69, 237, 0.3);
        }}
        .footer {{
            padding: 32px 40px;
            background-color: #fafbfd;
            border-top: 1px solid #f3f4f6;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
        }}
        .footer p {{
            margin: 0 0 8px 0;
        }}
        .footer p:last-child {{
            margin: 0;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 12px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .badge-success {{
            background-color: #ecfdf5;
            color: #059669;
            border: 1px solid #a7f3d0;
        }}
        .badge-info {{
            background-color: #eff6ff;
            color: #2563eb;
            border: 1px solid #bfdbfe;
        }}
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Hirevant</h1>
                <p>Enterprise HR Solutions</p>
            </div>
            <div class="content">
                {content}
            </div>
            <div class="footer">
                <p>&copy; 2026 Hirevant Inc. All rights reserved.</p>
                <p>Global Headquarters: Tech Hub Plaza, Floor 14, Bengaluru, India</p>
                <p>This is an automated operational notification. Please do not reply directly to this email.</p>
            </div>
        </div>
    </div>
</body>
</html>
"""

class EmailService:
    @staticmethod
    def send_html_email(subject, recipient_email, body_html, from_email=None):
        """Standard sender helper utilizing django.core.mail"""
        if not from_email:
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@hirevant.com')
        
        full_html = BASE_EMAIL_TEMPLATE.format(subject=subject, content=body_html)
        text_content = strip_tags(full_html)
        
        try:
            msg = EmailMultiAlternatives(subject, text_content, from_email, [recipient_email])
            msg.attach_alternative(full_html, "text/html")
            msg.send(fail_silently=False)
            logger.info(f"EMAIL SENT SUCCESSFULLY TO {recipient_email}: {subject}")
            return True
        except Exception as e:
            logger.error(f"FAILED TO SEND EMAIL TO {recipient_email} (Subject: {subject}): {str(e)}")
            return False

    @staticmethod
    def send_verification_email(candidate_email, full_name, token, otp):
        """1. Candidate Registered -> Email Verification Sent"""
        verify_url = f"{settings.CANDIDATE_PORTAL_URL}/verify-email?token={token}&email={candidate_email}"
        html = f"""
        <h2>Verify Your Email Address</h2>
        <p>Dear {full_name},</p>
        <p>Thank you for registering at Hirevant Careers Portal! To start applying for open positions, please verify your email address.</p>
        <p>You can verify your email using either of the following professional secure methods:</p>
        
        <div class="highlight-box">
            <h3>Method A: Enter 6-Digit OTP</h3>
            <p>Input this verification code directly in your browser:</p>
            <div class="otp-box">{otp}</div>
            <p style="text-align:center; font-size:11px; color:#6b7280;">Valid for 15 minutes</p>
        </div>

        <div style="text-align: center;">
            <p><strong>Method B: Verification Link</strong></p>
            <a href="{verify_url}" class="btn">Verify Account Instantly</a>
        </div>
        
        <p>If you did not register for a Hirevant account, please disregard this email.</p>
        """
        return EmailService.send_html_email("Welcome to Hirevant - Verify Your Email", candidate_email, html)

    @staticmethod
    def send_application_confirmation(candidate_email, full_name, job_title):
        """2. Applied for Job -> Application Confirmation Email"""
        html = f"""
        <h2>Application Received</h2>
        <p>Dear {full_name},</p>
        <p>We are delighted to confirm that your job application for the position of <strong>{job_title}</strong> has been successfully received.</p>
        <p>Our recruitment specialists are currently reviewing your qualifications against our job requisition standards. We will notify you as soon as the next screening stages are scheduled.</p>
        <div class="highlight-box">
            <h3>Application Summary</h3>
            <p><strong>Position:</strong> {job_title}</p>
            <p><strong>Status:</strong> <span class="badge badge-info">Applied / Under Review</span></p>
        </div>
        <p>Thank you for your interest in joining our team!</p>
        """
        return EmailService.send_html_email(f"Application Received: {job_title} - Hirevant", candidate_email, html)

    @staticmethod
    def send_recruiter_new_application_alert(recruiter_email, candidate_name, candidate_email, job_title):
        """Candidate Submits Application -> Recruiter Gets Email"""
        html = f"""
        <h2>New Job Application Received</h2>
        <p>Hello Recruiter,</p>
        <p>A new candidate has submitted an application for the open position: <strong>{job_title}</strong>.</p>
        <div class="highlight-box">
            <h3>Applicant Details</h3>
            <p><strong>Name:</strong> {candidate_name}</p>
            <p><strong>Email:</strong> {candidate_email}</p>
            <p><strong>Requisition:</strong> {job_title}</p>
        </div>
        <p>Please log in to the HRMS Dashboard to review their resume and qualifications.</p>
        <a href="{settings.FRONTEND_URL}/recruitment" class="btn">Review Application</a>
        """
        return EmailService.send_html_email(f"New Application Alert: {candidate_name} - {job_title}", recruiter_email, html)

    @staticmethod
    def send_shortlist_notification(candidate_email, full_name, job_title):
        """3. Shortlisted -> Shortlist Notification Email"""
        html = f"""
        <h2>Congratulations! You are Shortlisted</h2>
        <p>Dear {full_name},</p>
        <p>We have exciting news! After evaluating your profile and resume, our hiring panel has officially **shortlisted** you for the **{job_title}** position.</p>
        <p>Our recruitment coordinators will schedule your next evaluation round shortly. Please monitor your inbox and dashboard for scheduling invitations.</p>
        <div class="highlight-box">
            <h3>Candidate Stage Status</h3>
            <p><strong>Requisition:</strong> {job_title}</p>
            <p><strong>Stage:</strong> <span class="badge badge-success">Shortlisted / Under Evaluation</span></p>
        </div>
        <p>Best of luck with the upcoming rounds!</p>
        """
        return EmailService.send_html_email(f"Congratulations! You are shortlisted for {job_title}", candidate_email, html)

    @staticmethod
    def send_interview_invitation(candidate_email, full_name, job_title, interview_type, date_str, time_str, meeting_link, interviewer_name):
        """4. Interview Scheduled -> Interview Invitation Email"""
        html = f"""
        <h2>Interview Invitation: {interview_type} Round</h2>
        <p>Dear {full_name},</p>
        <p>You have been scheduled for a live interview round for the position of <strong>{job_title}</strong>.</p>
        <div class="highlight-box">
            <h3>Meeting Details</h3>
            <p><strong>Date:</strong> {date_str}</p>
            <p><strong>Time:</strong> {time_str}</p>
            <p><strong>Interview Type:</strong> {interview_type} Round</p>
            <p><strong>Interviewer:</strong> {interviewer_name}</p>
            <p><strong>Meeting Lobby URL:</strong> <a href="{meeting_link}" style="color:#6345ED; font-weight:bold;">{meeting_link}</a></p>
        </div>
        <div style="text-align: center;">
            <a href="{settings.CANDIDATE_PORTAL_URL}/dashboard" class="btn">Join Interview Room</a>
        </div>
        <p>Please log into your candidate dashboard 5 minutes prior to the scheduled start time to test your microphone and webcam streams.</p>
        """
        return EmailService.send_html_email(f"Interview Scheduled: {interview_type} Round - {job_title}", candidate_email, html)

    @staticmethod
    def send_interviewer_assignment_alert(interviewer_email, interviewer_name, candidate_name, job_title, interview_type, date_str, time_str, meeting_link):
        """Recruiter Assigns Interview -> HR/Manager Gets Email"""
        html = f"""
        <h2>Interview Conducting Assignment: {interview_type} Round</h2>
        <p>Dear {interviewer_name},</p>
        <p>You have been assigned as the primary interviewer for **{candidate_name}** applying for the position **{job_title}**.</p>
        <div class="highlight-box">
            <h3>Assignment Schedule</h3>
            <p><strong>Applicant Name:</strong> {candidate_name}</p>
            <p><strong>Interview Type:</strong> {interview_type} Round</p>
            <p><strong>Date:</strong> {date_str}</p>
            <p><strong>Time:</strong> {time_str}</p>
            <p><strong>Evaluation Meeting Link:</strong> <a href="{meeting_link}" style="color:#6345ED; font-weight:bold;">{meeting_link}</a></p>
        </div>
        <p>Please enter the assessment lobby via your HRMS workspace dashboard to record scores and upload feedback.</p>
        <a href="{settings.FRONTEND_URL}/recruitment" class="btn">Start Assessment Lobby</a>
        """
        return EmailService.send_html_email(f"Interview Assignment: {candidate_name} - {interview_type} Round", interviewer_email, html)

    @staticmethod
    def send_interview_rescheduled(candidate_email, full_name, job_title, interview_type, date_str, time_str, meeting_link, interviewer_name):
        """5. Interview Rescheduled -> Updated Interview Email"""
        html = f"""
        <h2>RESCHEDULED: Updated Interview Invitation</h2>
        <p>Dear {full_name},</p>
        <p>Please note that your scheduled **{interview_type}** round for **{job_title}** has been rescheduled. Below are the updated details:</p>
        <div class="highlight-box">
            <h3>New Meeting Schedule</h3>
            <p><strong>Date:</strong> {date_str}</p>
            <p><strong>Time:</strong> {time_str}</p>
            <p><strong>Interview Type:</strong> {interview_type} Round</p>
            <p><strong>Interviewer:</strong> {interviewer_name}</p>
            <p><strong>Meeting Lobby URL:</strong> <a href="{meeting_link}" style="color:#6345ED; font-weight:bold;">{meeting_link}</a></p>
        </div>
        <p>We apologize for any inconvenience caused and appreciate your flexibility.</p>
        """
        return EmailService.send_html_email(f"Updated Schedule: {interview_type} Round - {job_title}", candidate_email, html)

    @staticmethod
    def send_selection_notification(candidate_email, full_name, job_title):
        """6. Selected -> Selection Email"""
        html = f"""
        <h2>Congratulations! You Are Selected</h2>
        <p>Dear {full_name},</p>
        <p>We are absolutely thrilled to inform you that following your interviews, the hiring panel has **selected** you for employment as a permanent member of our team!</p>
        <p>Our Human Resources team is finalizing your structured compensation package, and your official Offer Letter will be released shortly.</p>
        <div class="highlight-box">
            <h3>Selection Details</h3>
            <p><strong>Position:</strong> {job_title}</p>
            <p><strong>Decision:</strong> <span class="badge badge-success">Selected for Hire</span></p>
        </div>
        <p>Welcome to the Hirevant family!</p>
        """
        return EmailService.send_html_email(f"Congratulations! You are selected for {job_title}", candidate_email, html)

    @staticmethod
    def send_offer_letter(candidate_email, full_name, job_title, salary, start_date, validity_date):
        """7. Offer Released -> Offer Letter Email"""
        html = f"""
        <h2>Your Employment Offer is Released</h2>
        <p>Dear {full_name},</p>
        <p>We are delighted to formally offer you employment at our company for the position of <strong>{job_title}</strong>!</p>
        <div class="highlight-box">
            <h3>Compensation & Offer Metrics</h3>
            <p><strong>Annual Package:</strong> INR {salary}</p>
            <p><strong>Joining Date:</strong> {start_date}</p>
            <p><strong>Offer Validity Until:</strong> {validity_date}</p>
        </div>
        <p>Please log in to your Careers Dashboard to view, review, and accept or decline your formal offer letter documents online.</p>
        <a href="{settings.CANDIDATE_PORTAL_URL}/dashboard" class="btn">View Offer Letter</a>
        """
        return EmailService.send_html_email(f"Employment Offer Released: {job_title} - Hirevant", candidate_email, html)

    @staticmethod
    def send_welcome_email(candidate_email, full_name, job_title, start_date):
        """8. Offer Accepted -> Welcome Email"""
        html = f"""
        <h2>Welcome to our Team! Offer Accepted</h2>
        <p>Dear {full_name},</p>
        <p>We are thrilled to receive your formal acceptance of our employment offer! We are extremely excited to have you join us starting on <strong>{start_date}</strong>.</p>
        <p>Our Onboarding Team will reach out shortly with guides and compliance check requirements to facilitate a seamless entry.</p>
        <p>Welcome aboard!</p>
        """
        return EmailService.send_html_email("Welcome to Hirevant! Offer Formally Accepted", candidate_email, html)

    @staticmethod
    def send_hr_offer_accepted_alert(hr_email, candidate_name, candidate_email, job_title, start_date):
        """Candidate Accepts Offer -> HR Gets Email"""
        html = f"""
        <h2>Action Required: Offer Formally Accepted</h2>
        <p>Dear HR Administrator,</p>
        <p>Candidate **{candidate_name}** ({candidate_email}) has formally accepted the employment offer for **{job_title}**.</p>
        <div class="highlight-box">
            <h3>Next Steps Onboarding</h3>
            <p><strong>Candidate:</strong> {candidate_name}</p>
            <p><strong>Expected Start Date:</strong> {start_date}</p>
        </div>
        <p>Please initialize their employee profile configuration and schedule compliance onboarding reviews.</p>
        """
        return EmailService.send_html_email(f"Offer Accepted Alert: {candidate_name} - {job_title}", hr_email, html)

    @staticmethod
    def send_employee_onboarding_guide(employee_email, full_name, designation, department):
        """9. Joined -> Employee Onboarding Email"""
        html = f"""
        <h2>Your Onboarding Portal is Active!</h2>
        <p>Dear {full_name},</p>
        <p>Welcome to your first day as **{designation}** in the **{department}** department!</p>
        <p>To ensure a smooth transition, we have compiled your onboarding package including corporate culture training, compliance forms, and IT setup modules.</p>
        <div class="highlight-box">
            <h3>First Day Checklist</h3>
            <p>1. Complete IT asset configurations</p>
            <p>2. Upload bank account records for payroll</p>
            <p>3. Review the Employee Handbook</p>
        </div>
        <p>We wish you an outstanding and highly rewarding career with us!</p>
        """
        return EmailService.send_html_email("Your Employee Onboarding Guide - Hirevant", employee_email, html)

    @staticmethod
    def send_credentials_email(employee_email, full_name, username, temp_password):
        """10. Account Created -> Credentials Email"""
        html = f"""
        <h2>Your Hirevant HRMS Account is Active</h2>
        <p>Dear {full_name},</p>
        <p>Your secure corporate employee account for the Hirevant Portal has been successfully generated.</p>
        <div class="highlight-box">
            <h3>Secure Log-in Credentials</h3>
            <p><strong>Portal URL:</strong> <a href="{settings.FRONTEND_URL}/login">{settings.FRONTEND_URL}/login</a></p>
            <p><strong>Username / Email ID:</strong> {username}</p>
            <p><strong>Temporary Password:</strong> <code style="font-weight:bold; background:#e0f2fe; padding:2px 6px; border-radius:4px;">{temp_password}</code></p>
        </div>
        <p style="color:#dc2626; font-size:12px; font-weight:bold;">Important: You will be required to update your temporary password immediately upon your first login.</p>
        """
        return EmailService.send_html_email("Corporate Account Generated - Hirevant HRMS", employee_email, html)

    @staticmethod
    def send_password_reset_email(user_email, full_name, otp):
        """11. Password Reset -> Reset Link/OTP Email"""
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={otp}&email={user_email}"
        html = f"""
        <h2>Password Reset Request</h2>
        <p>Dear {full_name},</p>
        <p>We received a request to reset your Hirevant HRMS portal password.</p>
        <p>You can reset your password using either of the following professional secure methods:</p>
        
        <div class="highlight-box">
            <h3>Method A: One-Click Reset Link</h3>
            <p>Click the button below to instantly navigate to the secure password update screen (your email and code will be automatically filled for you):</p>
            <div style="text-align: center;">
                <a href="{reset_url}" class="btn">Reset Password Instantly</a>
            </div>
        </div>
        
        <div class="highlight-box">
            <h3>Method B: Enter 6-Digit Code</h3>
            <p>Input this verification code manually in your browser:</p>
            <div class="otp-box">{otp}</div>
            <p style="text-align:center; font-size:11px; color:#dc2626; font-weight:bold;">Valid for 1 hour. Do not share this OTP with anyone.</p>
        </div>
        
        <p>If you did not initiate this request, please contact your security administrator immediately.</p>
        """
        return EmailService.send_html_email("Password Reset OTP Verification Code", user_email, html)

    @staticmethod
    def send_leave_approved(employee_email, full_name, leave_type, start_date, end_date, manager_name):
        """12. Leave Approved -> Approval Email"""
        html = f"""
        <h2>Leave Application APPROVED</h2>
        <p>Dear {full_name},</p>
        <p>Your request for leave has been successfully evaluated and **APPROVED** by your reporting manager.</p>
        <div class="highlight-box">
            <h3>Leave Detail Metrics</h3>
            <p><strong>Type:</strong> {leave_type}</p>
            <p><strong>Duration:</strong> {start_date} to {end_date}</p>
            <p><strong>Approved By:</strong> {manager_name}</p>
            <p><strong>Status:</strong> <span class="badge badge-success">Approved / Logged</span></p>
        </div>
        <p>Have a wonderful rest!</p>
        """
        return EmailService.send_html_email("Leave Application Approved - Hirevant", employee_email, html)

    @staticmethod
    def send_leave_rejected(employee_email, full_name, leave_type, start_date, end_date, manager_name, remarks):
        """13. Leave Rejected -> Rejection Email"""
        html = f"""
        <h2>Leave Application REJECTED</h2>
        <p>Dear {full_name},</p>
        <p>Your leave request was evaluated by your manager and has been **DECLINED** due to the following business constraints:</p>
        <div class="highlight-box">
            <h3>Leave Metrics</h3>
            <p><strong>Type:</strong> {leave_type}</p>
            <p><strong>Duration:</strong> {start_date} to {end_date}</p>
            <p><strong>Declined By:</strong> {manager_name}</p>
            <p><strong>Manager Remarks:</strong> "{remarks or 'No remarks provided'}"</p>
        </div>
        <p>Please align with your reporting manager for schedule alternatives.</p>
        """
        return EmailService.send_html_email("Leave Application Declined - Hirevant", employee_email, html)

    @staticmethod
    def send_payslip_notification(employee_email, full_name, month_year, net_salary):
        """14. Payslip Generated -> Payslip Notification Email"""
        html = f"""
        <h2>Your Monthly Payslip is Available</h2>
        <p>Dear {full_name},</p>
        <p>Your official salary slip for the payroll month <strong>{month_year}</strong> has been processed and is ready for download.</p>
        <div class="highlight-box">
            <h3>Payroll Summary</h3>
            <p><strong>Period:</strong> {month_year}</p>
            <p><strong>Net Credit:</strong> INR {net_salary}</p>
        </div>
        <p>Please log into your Employee Workspace to view and download your full itemized salary breakdown.</p>
        <a href="{settings.FRONTEND_URL}/payroll" class="btn">View Payslip Portal</a>
        """
        return EmailService.send_html_email(f"Salary Payslip Issued: {month_year} - Hirevant", employee_email, html)

    @staticmethod
    def send_appraisal_completed(employee_email, full_name, cycle_name, rating, remarks):
        """15. Appraisal Completed -> Appraisal Notification Email"""
        html = f"""
        <h2>Performance Evaluation Appraisal Completed</h2>
        <p>Dear {full_name},</p>
        <p>Your performance appraisal cycle for **{cycle_name}** has been officially completed.</p>
        <div class="highlight-box">
            <h3>Evaluation Rating Summary</h3>
            <p><strong>Cycle:</strong> {cycle_name}</p>
            <p><strong>Overall Score:</strong> {rating} / 5</p>
            <p><strong>Feedback Remarks:</strong> "{remarks}"</p>
        </div>
        <p>We appreciate your dedication and hard work toward achieving our shared company milestones!</p>
        """
        return EmailService.send_html_email(f"Performance Appraisal Finalized: {cycle_name}", employee_email, html)

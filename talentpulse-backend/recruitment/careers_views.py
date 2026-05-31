# CAREERS PORTAL BACKEND APIS
import jwt
import random
import secrets
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.hashers import check_password
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from recruitment.models import CandidateAccount, JobRequisition, Candidate, InterviewRound, OfferLetter, InterviewChatMessage
from notifications.tasks import dispatch_email
from recruitment.serializers import (
    CandidateAccountSerializer, CandidateRegisterSerializer, CareersJobSerializer,
    CandidateSerializer, InterviewRoundSerializer, OfferLetterSerializer
)

# Utility helper to check token and return authenticated external candidate account
def get_auth_candidate(request):
    auth_header = request.headers.get('Authorization') or request.META.get('HTTP_AUTHORIZATION')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        # Verify expiration
        exp = payload.get('exp')
        if exp and exp < timezone.now().timestamp():
            return None
        return CandidateAccount.objects.get(id=payload['candidate_id'])
    except Exception as e:
        print("CANDIDATE AUTH EXCEPTION:", str(e))
        return None


class CandidateRegisterView(APIView):
    """Register an external candidate profile"""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = CandidateRegisterSerializer(data=request.data)
        if serializer.is_valid():
            candidate = serializer.save()
            
            # Generate verification credentials
            ver_token = secrets.token_hex(20)
            otp = str(random.randint(100000, 999999))
            
            candidate.verification_token = ver_token
            candidate.otp_code = otp
            candidate.otp_created_at = timezone.now()
            candidate.is_verified = False
            candidate.save()
            
            # Asynchronously send email notification
            dispatch_email('send_verification_email', candidate.email, candidate.full_name, ver_token, otp)
            
            # Issue token immediately
            payload = {
                'candidate_id': candidate.id,
                'email': candidate.email,
                'exp': int((timezone.now() + timezone.timedelta(days=7)).timestamp()),
                'iat': int(timezone.now().timestamp())
            }
            token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
            
            return Response({
                'message': 'Account registered successfully. Please verify your email.',
                'token': token,
                'candidate': CandidateAccountSerializer(candidate).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CandidateLoginView(APIView):
    """Authenticate an external candidate profile"""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            candidate = CandidateAccount.objects.get(email=email)
        except CandidateAccount.DoesNotExist:
            return Response({'error': 'No account exists with this email address.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not check_password(password, candidate.password):
            return Response({'error': 'Incorrect password.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Issue custom JWT
        payload = {
            'candidate_id': candidate.id,
            'email': candidate.email,
            'exp': int((timezone.now() + timezone.timedelta(days=7)).timestamp()),
            'iat': int(timezone.now().timestamp())
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

        return Response({
            'message': 'Login successful.',
            'token': token,
            'candidate': CandidateAccountSerializer(candidate).data
        }, status=status.HTTP_200_OK)


class CandidateProfileView(APIView):
    """Candidate profile retrieve and update (resume, skills, location, experience)"""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        candidate = get_auth_candidate(request)
        if not candidate:
            return Response({'error': 'Unauthorized candidate session.'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(CandidateAccountSerializer(candidate).data)

    def patch(self, request):
        candidate = get_auth_candidate(request)
        if not candidate:
            return Response({'error': 'Unauthorized candidate session.'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = CandidateAccountSerializer(candidate, data=request.data, partial=True)
        if serializer.is_valid():
            # Handle manual file upload for resume if provided in FILES
            if 'resume' in request.FILES:
                candidate.resume = request.FILES['resume']
            
            serializer.save()
            return Response({
                'message': 'Profile updated successfully.',
                'candidate': CandidateAccountSerializer(candidate).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CareersJobsListView(APIView):
    """Publicly searchable open jobs directory"""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        # Only expose 'open' requisitions to careers catalog
        jobs = JobRequisition.objects.filter(status='open')
        
        # Search filter
        search_query = request.query_params.get('search')
        if search_query:
            jobs = jobs.filter(title__icontains=search_query) | jobs.filter(description__icontains=search_query)

        # Department filter
        dept_filter = request.query_params.get('department')
        if dept_filter:
            jobs = jobs.filter(department__iexact=dept_filter)

        return Response(CareersJobSerializer(jobs, many=True).data)


class CareersJobDetailView(APIView):
    """Public detail view for a specific job opening"""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request, pk):
        try:
            job = JobRequisition.objects.get(id=pk, status='open')
            return Response(CareersJobSerializer(job).data)
        except JobRequisition.DoesNotExist:
            return Response({'error': 'Job posting not found or is closed.'}, status=status.HTTP_404_NOT_FOUND)


class CareersApplyView(APIView):
    """Candidate submits a job application"""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        candidate_account = get_auth_candidate(request)
        if not candidate_account:
            return Response({'error': 'Unauthorized candidate session.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Enforce email verification requirement
        if not candidate_account.is_verified:
            return Response({'error': 'Email verification is required before you can apply for jobs. Please check your inbox or request a new code.'}, status=status.HTTP_403_FORBIDDEN)

        job_id = request.data.get('job_requisition_id')
        if not job_id:
            return Response({'error': 'job_requisition_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            job = JobRequisition.objects.get(id=job_id, status='open')
        except JobRequisition.DoesNotExist:
            return Response({'error': 'Job posting not found or is closed.'}, status=status.HTTP_404_NOT_FOUND)

        # Double apply check
        if Candidate.objects.filter(job_requisition=job, email=candidate_account.email).exists():
            return Response({'error': 'You have already applied for this position.'}, status=status.HTTP_400_BAD_REQUEST)

        # Separate full name into first and last
        name_parts = candidate_account.full_name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        # Auto-extract parameters or use form defaults
        current_company = request.data.get('current_company', '')
        current_designation = request.data.get('current_designation', '')
        cover_letter = request.data.get('cover_letter', '')

        # Use Candidate's profile resume as fallback if none supplied in apply form
        resume = request.FILES.get('resume') or candidate_account.resume

        application = Candidate.objects.create(
            candidate_account=candidate_account,
            job_requisition=job,
            first_name=first_name,
            last_name=last_name,
            email=candidate_account.email,
            phone=candidate_account.phone or request.data.get('phone', ''),
            current_company=current_company,
            current_designation=current_designation,
            resume=resume,
            cover_letter=cover_letter,
            status='applied'
        )

        # Dispatch confirmation email to Candidate
        dispatch_email('send_application_confirmation', candidate_account.email, candidate_account.full_name, job.title)

        # Dispatch new application alerts to all recruiters
        from django.contrib.auth import get_user_model
        User = get_user_model()
        recruiters = User.objects.filter(role='recruiter', is_active=True)
        for r in recruiters:
            dispatch_email('send_recruiter_new_application_alert', r.email, candidate_account.full_name, candidate_account.email, job.title)

        return Response({
            'message': 'Application submitted successfully.',
            'application': CandidateSerializer(application).data
        }, status=status.HTTP_201_CREATED)


class CareersApplicationsView(APIView):
    """Candidate views their job applications progress"""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        candidate_account = get_auth_candidate(request)
        if not candidate_account:
            return Response({'error': 'Unauthorized candidate session.'}, status=status.HTTP_401_UNAUTHORIZED)

        apps = Candidate.objects.filter(candidate_account=candidate_account)
        return Response(CandidateSerializer(apps, many=True).data)


class CareersInterviewsView(APIView):
    """Candidate views scheduled interviews"""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        candidate_account = get_auth_candidate(request)
        if not candidate_account:
            return Response({'error': 'Unauthorized candidate session.'}, status=status.HTTP_401_UNAUTHORIZED)

        rounds = InterviewRound.objects.filter(candidate__candidate_account=candidate_account)
        return Response(InterviewRoundSerializer(rounds, many=True).data)


class CareersOffersView(APIView):
    """Candidate views offer letters and accepts/declines them"""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        candidate_account = get_auth_candidate(request)
        if not candidate_account:
            return Response({'error': 'Unauthorized candidate session.'}, status=status.HTTP_401_UNAUTHORIZED)

        offers = OfferLetter.objects.filter(candidate__candidate_account=candidate_account)
        return Response(OfferLetterSerializer(offers, many=True).data)

    def patch(self, request):
        candidate_account = get_auth_candidate(request)
        if not candidate_account:
            return Response({'error': 'Unauthorized candidate session.'}, status=status.HTTP_401_UNAUTHORIZED)

        offer_id = request.data.get('offer_id')
        new_status = request.data.get('status')
        if not offer_id or new_status not in ['accepted', 'declined']:
            return Response({'error': 'offer_id and valid status (accepted/declined) are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            offer = OfferLetter.objects.get(id=offer_id, candidate__candidate_account=candidate_account)
        except OfferLetter.DoesNotExist:
            return Response({'error': 'Offer letter not found.'}, status=status.HTTP_404_NOT_FOUND)

        offer.status = new_status
        offer.save()

        # Update candidate status matching acceptance choice
        candidate = offer.candidate
        if new_status == 'accepted':
            candidate.status = 'offer_accepted' # transition to offer_accepted, not joined directly
            
            # Send welcome email and alert HR
            dispatch_email('send_welcome_email', candidate_account.email, candidate_account.full_name, offer.position_title, str(offer.start_date))
            
            from django.contrib.auth import get_user_model
            User = get_user_model()
            hrs = User.objects.filter(role='hr', is_active=True)
            for h in hrs:
                dispatch_email('send_hr_offer_accepted_alert', h.email, candidate_account.full_name, candidate_account.email, offer.position_title, str(offer.joining_date or offer.start_date))
        else:
            candidate.status = 'rejected'
        candidate.save()

        return Response({
            'message': f'Offer successfully {new_status}.',
            'offer': OfferLetterSerializer(offer).data
        })


class CareersInterviewChatView(APIView):
    """Candidate views and posts real-time chat messages in a scheduled interview round"""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request, round_id):
        candidate_account = get_auth_candidate(request)
        if not candidate_account:
            return Response({'error': 'Unauthorized candidate session.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            round_obj = InterviewRound.objects.get(id=round_id, candidate__candidate_account=candidate_account)
        except InterviewRound.DoesNotExist:
            return Response({'error': 'Interview round not found or unauthorized.'}, status=status.HTTP_404_NOT_FOUND)
        
        messages = round_obj.chat_messages.all()
        data = [{
            'id': m.id,
            'sender_type': m.sender_type,
            'sender_name': m.sender_name,
            'message': m.message,
            'timestamp': m.timestamp.isoformat()
        } for m in messages]
        return Response(data)

    def post(self, request, round_id):
        candidate_account = get_auth_candidate(request)
        if not candidate_account:
            return Response({'error': 'Unauthorized candidate session.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            round_obj = InterviewRound.objects.get(id=round_id, candidate__candidate_account=candidate_account)
        except InterviewRound.DoesNotExist:
            return Response({'error': 'Interview round not found or unauthorized.'}, status=status.HTTP_404_NOT_FOUND)
        
        message_text = request.data.get('message')
        if not message_text:
            return Response({'error': 'Message text is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        msg = InterviewChatMessage.objects.create(
            interview_round=round_obj,
            sender_type='candidate',
            sender_name=candidate_account.full_name,
            message=message_text
        )
        return Response({
            'id': msg.id,
            'sender_type': msg.sender_type,
            'sender_name': msg.sender_name,
            'message': msg.message,
            'timestamp': msg.timestamp.isoformat()
        }, status=status.HTTP_201_CREATED)


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        token = request.data.get('token')
        otp = request.data.get('otp')
        email = request.data.get('email')
        
        if email:
            email = email.strip().lower()
        if token:
            token = token.strip()
        if otp:
            otp = otp.strip()
            
        logger.info(f"VERIFICATION ATTEMPT: email='{email}', token='{token}', otp='{otp}'")
        
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            if otp:
                candidate = CandidateAccount.objects.get(email=email, otp_code=otp)
            elif token:
                candidate = CandidateAccount.objects.get(email=email, verification_token=token)
            else:
                return Response({'error': 'Either verification token or OTP code is required.'}, status=status.HTTP_400_BAD_REQUEST)
        except CandidateAccount.DoesNotExist:
            return Response({'error': 'Invalid verification details or expired session.'}, status=status.HTTP_400_BAD_REQUEST)
            
        candidate.is_verified = True
        candidate.otp_code = None
        candidate.verification_token = None
        candidate.save()
        
        # Custom JWT generation for seamless frontend login upon verification
        payload = {
            'candidate_id': candidate.id,
            'email': candidate.email,
            'exp': int((timezone.now() + timezone.timedelta(days=7)).timestamp()),
            'iat': int(timezone.now().timestamp())
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        
        return Response({
            'message': 'Email address successfully verified! You can now apply for jobs.',
            'token': token,
            'candidate': CandidateAccountSerializer(candidate).data
        }, status=status.HTTP_200_OK)


class CareersForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email')
        if email:
            email = email.strip().lower()
            
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            candidate = CandidateAccount.objects.get(email=email)
        except CandidateAccount.DoesNotExist:
            return Response({'message': 'If an account exists, a password reset link has been dispatched.'}, status=status.HTTP_200_OK)
            
        import random
        otp = str(random.randint(100000, 999999))
        candidate.otp_code = otp
        candidate.otp_created_at = timezone.now()
        candidate.save()
        
        from notifications.tasks import dispatch_email
        dispatch_email('send_password_reset_email', candidate.email, candidate.full_name, otp)
        
        return Response({'message': 'If an account exists, a password reset link has been dispatched.'}, status=status.HTTP_200_OK)


class CareersResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')
        
        if email:
            email = email.strip().lower()
        if otp:
            otp = otp.strip()
            
        if not email or not otp or not new_password:
            return Response({'error': 'Email, OTP, and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            candidate = CandidateAccount.objects.get(email=email, otp_code=otp)
        except CandidateAccount.DoesNotExist:
            return Response({'error': 'Invalid or expired password reset OTP.'}, status=status.HTTP_400_BAD_REQUEST)
            
        from django.contrib.auth.hashers import make_password
        candidate.password = make_password(new_password)
        candidate.otp_code = None
        candidate.save()
        
        return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)


class CareersInterviewPresenceView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request, round_id):
        candidate_account = get_auth_candidate(request)
        if not candidate_account:
            return Response({'error': 'Unauthorized candidate session.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            round_obj = InterviewRound.objects.get(id=round_id, candidate__candidate_account=candidate_account)
        except InterviewRound.DoesNotExist:
            return Response({'error': 'Interview round not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        # Update candidate presence on poll
        was_offline = not round_obj.is_candidate_live
        round_obj.is_candidate_live = True
        round_obj.candidate_last_seen = timezone.now()
        
        # Check if interviewer has timed out
        if round_obj.is_interviewer_live and round_obj.interviewer_last_seen:
            if (timezone.now() - round_obj.interviewer_last_seen).total_seconds() > 6:
                round_obj.is_interviewer_live = False
                
        round_obj.save(update_fields=['is_candidate_live', 'candidate_last_seen', 'is_interviewer_live'])
        
        if was_offline:
            # Create DB notification for interviewer and recruiter
            from notifications.models import Notification
            if round_obj.interviewer:
                Notification.objects.create(
                    recipient=round_obj.interviewer,
                    notification_type='recruitment_alert',
                    title='Candidate Joined Lobby',
                    message=f"Candidate {round_obj.candidate.get_full_name()} has joined the lobby.",
                    related_object_type='InterviewRound',
                    related_object_id=round_obj.id,
                    status='unread'
                )
            if round_obj.created_by and round_obj.created_by != round_obj.interviewer:
                Notification.objects.create(
                    recipient=round_obj.created_by,
                    notification_type='recruitment_alert',
                    title='Candidate Joined Lobby',
                    message=f"Candidate {round_obj.candidate.get_full_name()} is waiting.",
                    related_object_type='InterviewRound',
                    related_object_id=round_obj.id,
                    status='unread'
                )
                
        return Response({
            'is_candidate_live': round_obj.is_candidate_live,
            'is_interviewer_live': round_obj.is_interviewer_live
        })

    def post(self, request, round_id):
        # Candidate explicitly leaves
        candidate_account = get_auth_candidate(request)
        if not candidate_account:
            return Response({'error': 'Unauthorized candidate session.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            round_obj = InterviewRound.objects.get(id=round_id, candidate__candidate_account=candidate_account)
        except InterviewRound.DoesNotExist:
            return Response({'error': 'Interview round not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        round_obj.is_candidate_live = False
        round_obj.save(update_fields=['is_candidate_live'])
        
        # Create DB notification for interviewer/recruiter
        from notifications.models import Notification
        if round_obj.interviewer:
            Notification.objects.create(
                recipient=round_obj.interviewer,
                notification_type='recruitment_alert',
                title='Candidate Left Lobby',
                message=f"Candidate {round_obj.candidate.get_full_name()} has left the lobby.",
                related_object_type='InterviewRound',
                related_object_id=round_obj.id,
                status='unread'
            )
        if round_obj.created_by and round_obj.created_by != round_obj.interviewer:
            Notification.objects.create(
                recipient=round_obj.created_by,
                notification_type='recruitment_alert',
                title='Candidate Left Lobby',
                message=f"Candidate {round_obj.candidate.get_full_name()} has left.",
                related_object_type='InterviewRound',
                related_object_id=round_obj.id,
                status='unread'
            )
            
        return Response({'message': 'Successfully left lobby.'})



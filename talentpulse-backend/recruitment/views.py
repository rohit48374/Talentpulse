# RECRUITMENT VIEWS
from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response
from recruitment.models import JobRequisition, Candidate, InterviewRound, OfferLetter, InterviewChatMessage
from recruitment.serializers import (
    JobRequisitionSerializer, CandidateSerializer,
    InterviewRoundSerializer, OfferLetterSerializer
)
from core.pagination import StandardResultsSetPagination
from notifications.tasks import dispatch_email


class JobRequisitionViewSet(viewsets.ModelViewSet):
    serializer_class = JobRequisitionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['status', 'department']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', '-salary_range_max']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr', 'recruiter', 'manager']:
            return JobRequisition.objects.all()
        return JobRequisition.objects.none()

    def check_permissions(self, request):
        super().check_permissions(request)
        user = request.user
        if user.role not in ['admin', 'hr', 'recruiter', 'manager']:
            raise PermissionDenied("You do not have access to job requisitions.")
        
        # Write operations restricted to admin, hr, recruiter
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            if user.role not in ['admin', 'hr', 'recruiter']:
                raise PermissionDenied("Only recruiters, HR, and Admins can modify job requisitions.")


class CandidateViewSet(viewsets.ModelViewSet):
    serializer_class = CandidateSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['status', 'job_requisition']
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['applied_date', 'status']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr', 'recruiter']:
            return Candidate.objects.all()
        return Candidate.objects.none()

    def check_permissions(self, request):
        super().check_permissions(request)
        user = request.user
        if user.role not in ['admin', 'hr', 'recruiter']:
            raise PermissionDenied("You do not have access to candidate profiles.")


class InterviewRoundViewSet(viewsets.ModelViewSet):
    serializer_class = InterviewRoundSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['interview_type', 'status']
    search_fields = ['candidate__email', 'candidate__first_name']
    ordering_fields = ['scheduled_date', 'status']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr', 'recruiter']:
            return InterviewRound.objects.all()
        if user.role == 'manager':
            return InterviewRound.objects.filter(interviewer=user)
        return InterviewRound.objects.none()

    def check_permissions(self, request):
        super().check_permissions(request)
        user = request.user
        if user.role not in ['admin', 'hr', 'recruiter', 'manager']:
            raise PermissionDenied("You do not have access to interviews.")
        
        # Manager can only update, cannot create or destroy
        if self.action in ['create', 'destroy']:
            if user.role not in ['admin', 'hr', 'recruiter']:
                raise PermissionDenied("Only recruiters, HR, and Admins can create or delete interviews.")

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        user = request.user
        if user.role in ['admin', 'hr', 'recruiter']:
            return
        
        # Manager check
        if user.role == 'manager':
            if obj.interviewer != user:
                raise PermissionDenied("You are not the assigned interviewer for this round.")
            
            # Managers can only update feedback, rating, status, outcome and details scores
            if self.action in ['update', 'partial_update']:
                allowed_fields = {
                    'feedback', 'rating', 'status', 'outcome',
                    'communication_rating', 'confidence_rating', 'professionalism_rating', 'cultural_fit_rating',
                    'problem_solving_rating', 'tech_knowledge_rating', 'coding_rating', 'project_experience_rating', 'system_design_rating'
                }
                for field in request.data.keys():
                    if field not in allowed_fields:
                        raise PermissionDenied(f"Managers can only update: {', '.join(allowed_fields)}")
        else:
            raise PermissionDenied("You do not have permission to view or edit this interview round.")

    def perform_create(self, serializer):
        interview = serializer.save(created_by=self.request.user)
        # Automatically transition candidate status to interview_scheduled
        candidate = interview.candidate
        candidate.status = 'interview_scheduled'
        candidate.save()

        # Send interview invitation email to Candidate & assignment alert to Interviewer
        try:
            date_str = interview.scheduled_date.strftime("%Y-%m-%d")
            time_str = interview.scheduled_date.strftime("%H:%M")
            job_title = interview.requisition.title if interview.requisition else "General Requisition"
            interviewer_name = interview.interviewer.full_name if interview.interviewer else "HR Representative"
            
            # Candidate invite
            dispatch_email('send_interview_invitation', 
                           candidate.email, 
                           candidate.get_full_name(), 
                           job_title, 
                           interview.get_interview_type_display(), 
                           date_str, 
                           time_str, 
                           interview.meeting_link or "https://meet.google.com/mock-meet", 
                           interviewer_name)

            # Interviewer assignment alert
            if interview.interviewer:
                dispatch_email('send_interviewer_assignment_alert',
                               interview.interviewer.email,
                               interview.interviewer.full_name,
                               candidate.get_full_name(),
                               job_title,
                               interview.get_interview_type_display(),
                               date_str,
                               time_str,
                               interview.meeting_link or "https://meet.google.com/mock-meet")
        except Exception as e:
            print("ERROR IN TRIGGERING INTERVIEW SCHEDULING EMAILS:", str(e))

    def perform_update(self, serializer):
        old_round = self.get_object()
        old_date = old_round.scheduled_date
        interview = serializer.save()
        
        # Check if rescheduled
        if old_date != interview.scheduled_date:
            try:
                date_str = interview.scheduled_date.strftime("%Y-%m-%d")
                time_str = interview.scheduled_date.strftime("%H:%M")
                job_title = interview.requisition.title if interview.requisition else "General Requisition"
                interviewer_name = interview.interviewer.full_name if interview.interviewer else "HR Representative"
                
                # Candidate reschedule invite
                dispatch_email('send_interview_rescheduled',
                               interview.candidate.email,
                               interview.candidate.get_full_name(),
                               job_title,
                               interview.get_interview_type_display(),
                               date_str,
                               time_str,
                               interview.meeting_link or "https://meet.google.com/mock-meet",
                               interviewer_name)
                
                # Interviewer reschedule alert
                if interview.interviewer:
                    dispatch_email('send_interviewer_assignment_alert',
                                   interview.interviewer.email,
                                   interview.interviewer.full_name,
                                   interview.candidate.get_full_name(),
                                   job_title,
                                   interview.get_interview_type_display() + " (RESCHEDULED)",
                                   date_str,
                                   time_str,
                                   interview.meeting_link or "https://meet.google.com/mock-meet")
            except Exception as e:
                print("ERROR IN TRIGGERING RESCHEDULE EMAILS:", str(e))
                
        # If the status is completed, we update the candidate based on outcome
        if interview.status == 'completed':
            candidate = interview.candidate
            if interview.outcome == 'pass':
                next_status = 'selected' if interview.interview_type == 'hr' else 'shortlisted'
                candidate.status = next_status
                candidate.save()
                
                # Dispatch email alerts matching next stage status
                job_title = interview.requisition.title if interview.requisition else "General Requisition"
                if next_status == 'shortlisted':
                    dispatch_email('send_shortlist_notification', candidate.email, candidate.get_full_name(), job_title)
                elif next_status == 'selected':
                    dispatch_email('send_selection_notification', candidate.email, candidate.get_full_name(), job_title)
            elif interview.outcome == 'fail':
                candidate.status = 'rejected'
                candidate.save()

    @action(detail=True, methods=['get', 'post'])
    def chat(self, request, pk=None):
        """Allows recruiters and interviewers to poll or post chat messages during meetings"""
        interview_round = self.get_object()
        if request.method == 'GET':
            messages = interview_round.chat_messages.all()
            data = [{
                'id': m.id,
                'sender_type': m.sender_type,
                'sender_name': m.sender_name,
                'message': m.message,
                'timestamp': m.timestamp.isoformat()
            } for m in messages]
            return Response(data)
        
        elif request.method == 'POST':
            message_text = request.data.get('message')
            if not message_text:
                return Response({'error': 'Message text is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
            msg = InterviewChatMessage.objects.create(
                interview_round=interview_round,
                sender_type='interviewer',
                sender_name=request.user.full_name or request.user.username,
                message=message_text
            )
            return Response({
                'id': msg.id,
                'sender_type': msg.sender_type,
                'sender_name': msg.sender_name,
                'message': msg.message,
                'timestamp': msg.timestamp.isoformat()
            }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post', 'get'])
    def join_room(self, request, pk=None):
        from django.utils import timezone
        round_obj = self.get_object()
        
        # Check and update presence
        was_offline = not round_obj.is_interviewer_live
        round_obj.is_interviewer_live = True
        round_obj.interviewer_last_seen = timezone.now()
        
        # Check if candidate has timed out
        if round_obj.is_candidate_live and round_obj.candidate_last_seen:
            if (timezone.now() - round_obj.candidate_last_seen).total_seconds() > 6:
                round_obj.is_candidate_live = False
                
        round_obj.save(update_fields=['is_interviewer_live', 'interviewer_last_seen', 'is_candidate_live'])
        
        if was_offline:
            # Create DB notification for recruiter/creator
            from notifications.models import Notification
            if round_obj.created_by and round_obj.created_by != request.user:
                Notification.objects.create(
                    recipient=round_obj.created_by,
                    notification_type='recruitment_alert',
                    title='Interviewer Joined Lobby',
                    message=f"Interviewer {request.user.full_name or request.user.username} has joined the lobby for candidate {round_obj.candidate.get_full_name()}.",
                    related_object_type='InterviewRound',
                    related_object_id=round_obj.id,
                    status='unread'
                )
        return Response({
            'message': 'Successfully joined room.', 
            'is_candidate_live': round_obj.is_candidate_live,
            'is_interviewer_live': round_obj.is_interviewer_live
        })

    @action(detail=True, methods=['post'])
    def leave_room(self, request, pk=None):
        round_obj = self.get_object()
        round_obj.is_interviewer_live = False
        round_obj.save(update_fields=['is_interviewer_live'])
        
        # Create DB notification for recruiter/creator
        from notifications.models import Notification
        if round_obj.created_by:
            Notification.objects.create(
                recipient=round_obj.created_by,
                notification_type='recruitment_alert',
                title='Interviewer Left Lobby',
                message=f"Interviewer {request.user.full_name or request.user.username} has left the lobby.",
                related_object_type='InterviewRound',
                related_object_id=round_obj.id,
                status='unread'
            )
        return Response({'message': 'Successfully left room.'})



class OfferLetterViewSet(viewsets.ModelViewSet):
    serializer_class = OfferLetterSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['status']
    search_fields = ['candidate__email']
    ordering_fields = ['created_date', 'offer_validity']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr', 'recruiter']:
            return OfferLetter.objects.all()
        return OfferLetter.objects.none()

    def check_permissions(self, request):
        super().check_permissions(request)
        user = request.user
        if user.role not in ['admin', 'hr', 'recruiter']:
            raise PermissionDenied("You do not have access to offer letters.")

    def perform_create(self, serializer):
        offer = serializer.save()
        # Automatically transition candidate status to offered when offer is released
        candidate = offer.candidate
        candidate.status = 'offered'
        candidate.save()

        # Asynchronously dispatch offer email to candidate
        try:
            dispatch_email('send_offer_letter', 
                           candidate.email, 
                           candidate.get_full_name(), 
                           offer.position_title, 
                           str(offer.salary), 
                           str(offer.start_date), 
                           str(offer.offer_validity))
        except Exception as e:
            print("ERROR IN SENDING OFFER LETTER EMAIL:", str(e))


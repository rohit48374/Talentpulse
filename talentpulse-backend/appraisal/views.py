# APPRAISAL VIEWS
from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import PermissionDenied
from appraisal.models import AppraisalCycle, GoalSheet, EmployeeAppraisal, PromotionRecommendation
from appraisal.serializers import (
    AppraisalCycleSerializer, GoalSheetSerializer,
    EmployeeAppraisalSerializer, PromotionRecommendationSerializer
)
from core.pagination import StandardResultsSetPagination
from django.db.models import Q


class AppraisalCycleViewSet(viewsets.ModelViewSet):
    queryset = AppraisalCycle.objects.all()
    serializer_class = AppraisalCycleSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['status', 'financial_year']
    ordering_fields = ['-start_date']

    def check_permissions(self, request):
        super().check_permissions(request)
        user = request.user
        # Write operations restricted to admin, hr
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            if user.role not in ['admin', 'hr']:
                raise PermissionDenied("Only HR and Admins can configure appraisal cycles.")


class GoalSheetViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSheetSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['status', 'appraisal_cycle']
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return GoalSheet.objects.all()
        if user.role == 'manager':
            return GoalSheet.objects.filter(Q(employee=user) | Q(employee__employee_profile__reporting_manager=user))
        return GoalSheet.objects.filter(employee=user)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        user = request.user
        if self.action in ['update', 'partial_update']:
            if obj.employee != user and user.role not in ['admin', 'hr']:
                # If manager of the employee
                profile = getattr(obj.employee, 'employee_profile', None)
                if user.role == 'manager' and profile and profile.reporting_manager == user:
                    # Manager can only update status/comments
                    allowed_fields = {'status', 'manager_comments'}
                    for field in request.data.keys():
                        if field not in allowed_fields:
                            raise PermissionDenied("Managers can only update status and manager comments.")
                else:
                    raise PermissionDenied("You do not have permission to modify this goal sheet.")
        
        if self.action == 'destroy':
            if obj.employee != user and user.role not in ['admin', 'hr']:
                raise PermissionDenied("You cannot delete this goal sheet.")


class EmployeeAppraisalViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeAppraisalSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['status', 'final_rating']
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return EmployeeAppraisal.objects.all()
        if user.role == 'manager':
            return EmployeeAppraisal.objects.filter(Q(manager=user) | Q(employee__employee_profile__reporting_manager=user) | Q(employee=user))
        return EmployeeAppraisal.objects.filter(employee=user)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        user = request.user
        if self.action in ['update', 'partial_update']:
            if obj.employee == user:
                # Employee updating self review
                allowed_fields = {'self_rating', 'self_comments', 'status'}
                for field in request.data.keys():
                    if field not in allowed_fields:
                        raise PermissionDenied("Employees can only update self rating, self comments, and status.")
            elif user.role in ['admin', 'hr']:
                pass
            elif user.role == 'manager' and (obj.manager == user or getattr(obj.employee.employee_profile, 'reporting_manager', None) == user):
                # Manager updating manager review
                allowed_fields = {'manager_rating', 'manager_comments', 'final_rating', 'performance_remarks', 'strengths', 'areas_for_improvement', 'development_plan', 'status'}
                for field in request.data.keys():
                    if field not in allowed_fields:
                        raise PermissionDenied("Managers can only update manager ratings, comments, development plans, and status.")
            else:
                raise PermissionDenied("You do not have permission to modify this appraisal.")
        
        if self.action == 'destroy':
            if user.role not in ['admin', 'hr']:
                raise PermissionDenied("Only HR and Admins can delete appraisals.")

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_status = old_instance.status
        
        instance = serializer.save()
        
        # When status transitions to completed
        if old_status != 'completed' and instance.status == 'completed':
            try:
                from notifications.tasks import dispatch_email
                dispatch_email('send_appraisal_completed', 
                               instance.employee.email, 
                               instance.employee.full_name or instance.employee.username, 
                               instance.appraisal_cycle.name if instance.appraisal_cycle else "Performance Cycle", 
                               str(instance.final_rating or instance.manager_rating or 5), 
                               instance.performance_remarks or 'Exceptional contribution recorded.')
            except Exception as e:
                print("ERROR IN SENDING APPRAISAL COMPLETED EMAIL:", str(e))


class PromotionRecommendationViewSet(viewsets.ModelViewSet):
    serializer_class = PromotionRecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['status', 'effective_date']
    search_fields = ['employee__email', 'employee__full_name']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return PromotionRecommendation.objects.all()
        if user.role == 'manager':
            return PromotionRecommendation.objects.filter(employee__employee_profile__reporting_manager=user)
        return PromotionRecommendation.objects.none()

    def check_permissions(self, request):
        super().check_permissions(request)
        user = request.user
        if user.role not in ['admin', 'hr', 'manager']:
            raise PermissionDenied("You do not have access to promotion recommendations.")
    
    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        user = request.user
        if user.role in ['admin', 'hr']:
            return
        if user.role == 'manager':
            profile = getattr(obj.employee, 'employee_profile', None)
            if not profile or profile.reporting_manager != user:
                raise PermissionDenied("You can only access promotion recommendations for your team members.")
            if self.action in ['update', 'partial_update']:
                if obj.status != 'recommended':
                    raise PermissionDenied("You cannot modify an approved or rejected promotion recommendation.")
        else:
            raise PermissionDenied("You do not have permission to access this recommendation.")

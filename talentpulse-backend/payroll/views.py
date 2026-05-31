# PAYROLL VIEWS
from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import PermissionDenied
from payroll.models import SalaryStructure, PayrollRun, Payslip, Bonus
from payroll.serializers import (
    SalaryStructureSerializer, PayrollRunSerializer,
    PayslipSerializer, BonusSerializer
)
from core.pagination import StandardResultsSetPagination
from notifications.tasks import dispatch_email


class SalaryStructureViewSet(viewsets.ModelViewSet):
    serializer_class = SalaryStructureSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['effective_from']
    search_fields = ['employee__email', 'employee__full_name']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['payroll', 'admin', 'hr']:
            return SalaryStructure.objects.all()
        if user.role == 'employee':
            return SalaryStructure.objects.filter(employee=user)
        return SalaryStructure.objects.none()

    def check_permissions(self, request):
        super().check_permissions(request)
        user = request.user
        if user.role not in ['payroll', 'admin', 'hr', 'employee']:
            raise PermissionDenied("You do not have access to salary structures.")
        
        # Write operations restricted to payroll and admin
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            if user.role not in ['payroll', 'admin']:
                raise PermissionDenied("Only Payroll Executives and Admins can create or modify salary structures.")


class PayrollRunViewSet(viewsets.ModelViewSet):
    queryset = PayrollRun.objects.all()
    serializer_class = PayrollRunSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['status', 'month_year']
    ordering_fields = ['-month_year']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['payroll', 'admin', 'hr']:
            return PayrollRun.objects.all()
        return PayrollRun.objects.none()

    def check_permissions(self, request):
        super().check_permissions(request)
        user = request.user
        if user.role not in ['payroll', 'admin', 'hr']:
            raise PermissionDenied("You do not have access to payroll runs.")
        
        # Write operations restricted to payroll and admin
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            if user.role not in ['payroll', 'admin']:
                raise PermissionDenied("Only Payroll Executives and Admins can execute or modify payroll runs.")
    
    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        if instance.status == 'processed':
            self._process_payroll(instance)
            
    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_status = old_instance.status
        
        instance = serializer.save()
        new_status = instance.status
        
        if (old_status == 'draft' or old_status == 'processing') and new_status == 'processed':
            self._process_payroll(instance)
            
    def _process_payroll(self, payroll_run):
        from django.contrib.auth import get_user_model
        from decimal import Decimal
        from django.db.models import Sum
        from payroll.models import SalaryStructure, Payslip, Bonus
        
        try:
            from attendance.models import AttendanceRecord
        except ImportError:
            AttendanceRecord = None
            
        import calendar
        import datetime

        User = get_user_model()
        month_year = payroll_run.month_year
        year, month = map(int, month_year.split('-'))
        
        _, num_days_in_month = calendar.monthrange(year, month)
        start_date = datetime.date(year, month, 1)
        end_date = datetime.date(year, month, num_days_in_month)

        employees = User.objects.filter(is_active=True)
        
        total_gross = Decimal('0.00')
        total_ded = Decimal('0.00')
        total_net = Decimal('0.00')
        emp_count = 0
        
        for emp in employees:
            if emp.role == 'admin' and not SalaryStructure.objects.filter(employee=emp).exists():
                continue
                
            emp_count += 1
            
            try:
                struct = SalaryStructure.objects.get(employee=emp)
                base = struct.base_salary
                hra = struct.hra
                da = struct.da
                other_allow = struct.other_allowances
                pf = struct.pf_contribution
                it = struct.it
                other_ded = struct.other_deductions
            except SalaryStructure.DoesNotExist:
                profile = getattr(emp, 'employee_profile', None)
                if profile and profile.grade:
                    base = profile.grade.base_salary
                else:
                    base = Decimal('30000.00')
                    
                hra = round(base * Decimal('0.30'), 2)
                da = round(base * Decimal('0.10'), 2)
                other_allow = Decimal('1000.00')
                pf = round(base * Decimal('0.12'), 2)
                it = round(base * Decimal('0.10'), 2)
                other_ded = Decimal('0.00')

            bonuses = Bonus.objects.filter(employee=emp, month_year=month_year, status='approved')
            bonus_amount = bonuses.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            days_worked = 22
            days_leave = 0
            if AttendanceRecord:
                records = AttendanceRecord.objects.filter(employee=emp, date__range=(start_date, end_date))
                if records.exists():
                    present_count = records.filter(status__in=['present', 'work_from_home']).count()
                    half_day_count = records.filter(status='half_day').count()
                    leave_count = records.filter(status='leave').count()
                    
                    days_worked = present_count + (half_day_count * 0.5)
                    days_leave = leave_count
                    
            gross = base + hra + da + other_allow + bonus_amount
            deductions = pf + it + other_ded
            net = gross - deductions
            
            Payslip.objects.update_or_create(
                payroll_run=payroll_run,
                employee=emp,
                defaults={
                    'base_salary': base,
                    'hra': hra,
                    'da': da,
                    'other_allowances': other_allow,
                    'bonus': bonus_amount,
                    'gross_salary': gross,
                    'pf_contribution': pf,
                    'it': it,
                    'other_deductions': other_ded,
                    'total_deductions': deductions,
                    'net_salary': net,
                    'days_worked': int(days_worked),
                    'days_leave': int(days_leave),
                    'status': 'generated'
                }
            )

            # Asynchronously send payslip email to employee
            try:
                dispatch_email('send_payslip_notification', emp.email, emp.full_name or emp.username, payroll_run.month_year, str(net))
            except Exception as e:
                print("ERROR IN SENDING PAYSLIP EMAIL:", str(e))
            
            total_gross += gross
            total_ded += deductions
            total_net += net

        payroll_run.total_employees = emp_count
        payroll_run.total_gross_salary = total_gross
        payroll_run.total_deductions = total_ded
        payroll_run.total_net_salary = total_net
        payroll_run.save()


class PayslipViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PayslipSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['status', 'payroll_run']
    search_fields = ['employee__email', 'employee__full_name']
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['payroll', 'admin', 'hr']:
            return Payslip.objects.all()
        if user.role == 'employee':
            return Payslip.objects.filter(employee=user)
        return Payslip.objects.none()

    def check_permissions(self, request):
        super().check_permissions(request)
        user = request.user
        if user.role not in ['payroll', 'admin', 'hr', 'employee']:
            raise PermissionDenied("You do not have access to payslips.")


class BonusViewSet(viewsets.ModelViewSet):
    queryset = Bonus.objects.all()
    serializer_class = BonusSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['status', 'month_year']
    search_fields = ['employee__email', 'employee__full_name']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['payroll', 'admin', 'hr']:
            return Bonus.objects.all()
        if user.role == 'employee':
            return Bonus.objects.filter(employee=user)
        return Bonus.objects.none()

    def check_permissions(self, request):
        super().check_permissions(request)
        user = request.user
        if user.role not in ['payroll', 'admin', 'hr', 'employee']:
            raise PermissionDenied("You do not have access to bonuses.")
        
        # Write operations restricted to payroll and admin
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            if user.role not in ['payroll', 'admin']:
                raise PermissionDenied("Only Payroll Executives and Admins can create or modify bonuses.")

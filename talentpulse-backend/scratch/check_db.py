import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from employees.models import EmployeeProfile
from attendance.models import LeaveApplication, LeaveType, LeaveBalance

User = get_user_model()

print("--- USERS ---")
for u in User.objects.all():
    print(f"ID: {u.id}, Email: {u.email}, Full Name: {u.full_name}, Role: {u.role}")

print("\n--- EMPLOYEE PROFILES ---")
for p in EmployeeProfile.objects.all():
    mgr_name = p.reporting_manager.full_name if p.reporting_manager else "None"
    print(f"User: {p.user.full_name}, Manager: {mgr_name}")

print("\n--- LEAVE APPLICATIONS ---")
for l in LeaveApplication.objects.all():
    print(f"ID: {l.id}, Employee: {l.employee.full_name}, Status: {l.status}, Start: {l.start_date}, End: {l.end_date}")

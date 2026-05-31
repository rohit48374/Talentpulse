"""
Management command to seed initial data for TalentPulse HRMS
Usage: python manage.py seed_initial_data
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from attendance.models import LeaveType
from appraisal.models import AppraisalCycle
from employees.models import Department, Designation, GradeStructure

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds initial data for the TalentPulse HRMS system'

    def handle(self, *args, **options):
        self.stdout.write('Starting data seeding...')

        # Create Leave Types
        leave_types = [
            {'name': 'Casual Leave', 'max_days_per_year': 12, 'is_paid': True},
            {'name': 'Sick Leave', 'max_days_per_year': 10, 'is_paid': True},
            {'name': 'Annual Leave', 'max_days_per_year': 20, 'is_paid': True},
            {'name': 'Maternity Leave', 'max_days_per_year': 180, 'is_paid': True, 'gender_specific': 'F'},
            {'name': 'Paternity Leave', 'max_days_per_year': 15, 'is_paid': True, 'gender_specific': 'M'},
            {'name': 'Unpaid Leave', 'max_days_per_year': 30, 'is_paid': False},
        ]

        for lt in leave_types:
            gender_specific = lt.pop('gender_specific', None)
            LeaveType.objects.get_or_create(name=lt['name'], defaults={**lt, 'gender_specific': gender_specific or ''})
            self.stdout.write(self.style.SUCCESS(f"[OK] Created leave type: {lt['name']}"))

        # Create Grade Structures
        grades = [
            {'grade': 'A', 'level': 1, 'base_salary': 30000},
            {'grade': 'B', 'level': 2, 'base_salary': 40000},
            {'grade': 'C', 'level': 3, 'base_salary': 50000},
            {'grade': 'D', 'level': 4, 'base_salary': 60000},
            {'grade': 'E', 'level': 5, 'base_salary': 75000},
            {'grade': 'F', 'level': 6, 'base_salary': 90000},
        ]

        for grade in grades:
            GradeStructure.objects.get_or_create(grade=grade['grade'], defaults=grade)
            self.stdout.write(self.style.SUCCESS(f"[OK] Created grade structure: {grade['grade']}"))

        # Create Departments
        departments = [
            {'name': 'Engineering', 'description': 'Product Development'},
            {'name': 'Human Resources', 'description': 'HR Operations'},
            {'name': 'Finance', 'description': 'Financial Management'},
            {'name': 'Sales', 'description': 'Sales and Business Development'},
            {'name': 'Marketing', 'description': 'Marketing and Communications'},
        ]

        for dept in departments:
            Department.objects.get_or_create(name=dept['name'], defaults=dept)
            self.stdout.write(self.style.SUCCESS(f"[OK] Created department: {dept['name']}"))

        # Create Designations
        designations = [
            {'name': 'Junior Developer', 'department_id': 1, 'grade': 'A', 'salary_range_min': 30000, 'salary_range_max': 40000},
            {'name': 'Senior Developer', 'department_id': 1, 'grade': 'C', 'salary_range_min': 50000, 'salary_range_max': 70000},
            {'name': 'Engineering Manager', 'department_id': 1, 'grade': 'E', 'salary_range_min': 75000, 'salary_range_max': 100000},
            {'name': 'HR Executive', 'department_id': 2, 'grade': 'B', 'salary_range_min': 40000, 'salary_range_max': 50000},
            {'name': 'HR Manager', 'department_id': 2, 'grade': 'D', 'salary_range_min': 60000, 'salary_range_max': 80000},
            {'name': 'Finance Executive', 'department_id': 3, 'grade': 'B', 'salary_range_min': 40000, 'salary_range_max': 50000},
            {'name': 'Sales Executive', 'department_id': 4, 'grade': 'B', 'salary_range_min': 35000, 'salary_range_max': 50000},
            {'name': 'Marketing Manager', 'department_id': 5, 'grade': 'D', 'salary_range_min': 60000, 'salary_range_max': 80000},
        ]

        for desig in designations:
            Designation.objects.get_or_create(name=desig['name'], defaults=desig)
            self.stdout.write(self.style.SUCCESS(f"[OK] Created designation: {desig['name']}"))

        self.stdout.write(self.style.SUCCESS('[OK] Data seeding completed successfully!'))

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from employees.models import Department, Designation, GradeStructure, EmployeeProfile

User = get_user_model()


class EmployeeProfilePrivacyTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create Grade and Department
        self.grade = GradeStructure.objects.create(grade='A', level=1, base_salary=30000.00)
        self.dept = Department.objects.create(name='Engineering', description='Dev Team')
        self.desig = Designation.objects.create(name='Junior Developer', department=self.dept, grade='A')
        
        # Create Owner User
        self.owner = User.objects.create_user(
            username='owner',
            email='owner@test.com',
            password='Password123!',
            full_name='Owner Employee',
            role='employee'
        )
        
        # Configure Profile details
        self.owner_profile = EmployeeProfile.objects.get(user=self.owner)
        self.owner_profile.department = self.dept
        self.owner_profile.designation = self.desig
        self.owner_profile.grade = self.grade
        self.owner_profile.pan_number = 'ABCDE1234F'
        self.owner_profile.aadhar_number = '123456789012'
        self.owner_profile.passport_number = 'A1234567'
        self.owner_profile.save()
        
        # Create Observer User (Regular Employee)
        self.observer = User.objects.create_user(
            username='observer',
            email='observer@test.com',
            password='Password123!',
            full_name='Observer Employee',
            role='employee'
        )
        
        # Create HR Admin User
        self.hr = User.objects.create_user(
            username='hr_admin',
            email='hr@test.com',
            password='Password123!',
            full_name='HR Admin User',
            role='hr'
        )

    def test_observer_receives_stripped_public_profile(self):
        """Test that a regular employee viewing another profile receives stripped public details"""
        self.client.force_authenticate(user=self.observer)
        
        url = f"/api/employees/profiles/{self.owner_profile.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify public fields are present
        self.assertIn('user_full_name', response.data)
        self.assertIn('department_name', response.data)
        self.assertIn('designation_name', response.data)
        
        # Verify sensitive fields are strictly excluded
        self.assertNotIn('pan_number', response.data)
        self.assertNotIn('aadhar_number', response.data)
        self.assertNotIn('passport_number', response.data)
        self.assertNotIn('grade_base_salary', response.data)
        self.assertNotIn('personal_email', response.data)

    def test_owner_receives_full_profile(self):
        """Test that a user querying their own profile receives full details"""
        self.client.force_authenticate(user=self.owner)
        
        url = f"/api/employees/profiles/{self.owner_profile.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify sensitive fields are fully present
        self.assertIn('pan_number', response.data)
        self.assertEqual(response.data['pan_number'], 'ABCDE1234F')
        self.assertIn('aadhar_number', response.data)
        self.assertIn('passport_number', response.data)
        self.assertIn('grade_base_salary', response.data)

    def test_hr_receives_full_profile(self):
        """Test that an HR administrator receives full profile details"""
        self.client.force_authenticate(user=self.hr)
        
        url = f"/api/employees/profiles/{self.owner_profile.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify sensitive fields are fully present for HR
        self.assertIn('pan_number', response.data)
        self.assertEqual(response.data['pan_number'], 'ABCDE1234F')

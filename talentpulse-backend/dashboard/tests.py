from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class CentralDashboardEngineTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create Employee User
        self.employee = User.objects.create_user(
            username='emp',
            email='emp@test.com',
            password='Password123!',
            full_name='John Employee',
            role='employee'
        )
        
        # Create Manager User
        self.manager = User.objects.create_user(
            username='mgr',
            email='mgr@test.com',
            password='Password123!',
            full_name='Jane Manager',
            role='manager'
        )

        # Create HR Admin User
        self.hr = User.objects.create_user(
            username='hr',
            email='hr@test.com',
            password='Password123!',
            full_name='HR Administrator',
            role='hr'
        )

        self.dashboard_url = '/api/dashboard/'

    def test_employee_dashboard_response_format(self):
        """Test central dashboard for employee role returns correct structure"""
        self.client.force_authenticate(user=self.employee)
        response = self.client.get(self.dashboard_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'employee')
        
        # Verify complete JSON format structure required by prompt
        self.assertIn('stats_cards', response.data)
        self.assertIn('widgets', response.data)
        self.assertIn('sidebar_menus', response.data)
        self.assertIn('quick_actions', response.data)
        self.assertIn('notifications', response.data)
        self.assertIn('permissions', response.data)
        
        # Verify exact stats cards
        stats_titles = [card['title'] for card in response.data['stats_cards']]
        self.assertIn('Present Days', stats_titles)
        self.assertIn('Remaining Leaves', stats_titles)
        self.assertIn('Pending Requests', stats_titles)
        self.assertIn('Latest Payslip', stats_titles)

    def test_manager_dashboard_response_format(self):
        """Test central dashboard for manager role returns correct structure"""
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(self.dashboard_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'manager')
        
        stats_titles = [card['title'] for card in response.data['stats_cards']]
        self.assertIn('Team Strength', stats_titles)
        self.assertIn('Pending Leave Requests', stats_titles)
        self.assertIn('Attendance Rate', stats_titles)
        self.assertIn('Pending Reviews', stats_titles)

    def test_hr_dashboard_response_format(self):
        """Test central dashboard for HR/Admin role returns correct structure"""
        self.client.force_authenticate(user=self.hr)
        response = self.client.get(self.dashboard_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'hr')
        
        stats_titles = [card['title'] for card in response.data['stats_cards']]
        self.assertIn('Total Employees', stats_titles)
        self.assertIn('Active Recruitments', stats_titles)
        self.assertIn('Attrition Rate', stats_titles)
        self.assertIn('Departments', stats_titles)

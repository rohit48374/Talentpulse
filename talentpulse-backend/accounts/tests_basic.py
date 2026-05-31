"""
Unit tests for Accounts module
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class UserRegistrationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/accounts/users/register/'

    def test_user_registration_fails_disabled(self):
        """Test public user registration is disabled and returns 403"""
        data = {
            'email': 'newuser@test.com',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
            'full_name': 'Test User',
            'phone': '1234567890'
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['error'], 'Public registration is disabled. Please contact your HR department or System Administrator.')


class UserAuthenticationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@test.com',
            password='TestPass123!',
            full_name='Test User'
        )
        self.login_url = '/api/accounts/users/login/'

    def test_user_login_success(self):
        """Test successful user login"""
        data = {
            'email': 'testuser@test.com',
            'password': 'TestPass123!'
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_user_login_invalid_credentials(self):
        """Test login fails with invalid credentials"""
        data = {
            'email': 'testuser@test.com',
            'password': 'WrongPassword123!'
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserRegistrationSafeguardTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/accounts/users/register/'

    def test_public_signup_blocked_for_all_roles(self):
        """Test public registration attempts are strictly blocked and do not create DB records"""
        data = {
            'email': 'manager@test.com',
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!',
            'full_name': 'Test Manager',
            'role': 'manager'
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verify directly in the DB that no user was created
        self.assertFalse(User.objects.filter(email='manager@test.com').exists())


class UserPasswordResetTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@test.com',
            password='OldPassword123!',
            full_name='Test User'
        )
        self.forgot_url = '/api/accounts/users/forgot_password/'
        self.reset_url = '/api/accounts/users/reset_password/'

    def test_forgot_and_reset_password_flow(self):
        """Test full password recovery cycle"""
        # Step 1: Request reset code
        response = self.client.post(self.forgot_url, {'email': 'testuser@test.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data.get('token')
        self.assertIsNotNone(token)
        
        # Verify direct DB field setting
        self.user.refresh_from_db()
        self.assertEqual(self.user.reset_token, token)
        
        # Step 2: Reset using token
        reset_data = {
            'email': 'testuser@test.com',
            'token': token,
            'new_password': 'NewPassword123!',
            'new_password_confirm': 'NewPassword123!'
        }
        reset_response = self.client.post(self.reset_url, reset_data)
        self.assertEqual(reset_response.status_code, status.HTTP_200_OK)
        
        # Step 3: Verify login works with new credentials
        login_response = self.client.post('/api/accounts/users/login/', {
            'email': 'testuser@test.com',
            'password': 'NewPassword123!'
        })
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

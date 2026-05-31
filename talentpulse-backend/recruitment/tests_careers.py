from django.test import TestCase
from django.contrib.auth.hashers import check_password
from rest_framework.test import APIClient
from rest_framework import status
from recruitment.models import CandidateAccount, JobRequisition, Candidate

class CareersAuthAndJobsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/recruitment/careers/auth/register/'
        self.login_url = '/api/recruitment/careers/auth/login/'
        self.jobs_url = '/api/recruitment/careers/jobs/'
        self.apply_url = '/api/recruitment/careers/applications/apply/'
        
        # Setup an open job opening
        self.job = JobRequisition.objects.create(
            title="Senior React Engineer",
            description="We are looking for a senior front-end engineer.",
            department="Engineering",
            designation="Senior Engineer",
            status="open",
            position_count=2
        )

    def test_candidate_registration_and_login_flow(self):
        """Test candidate can register, receive a custom token, and login successfully"""
        # Step 1: Register Account
        reg_data = {
            'email': 'candidate@test.com',
            'password': 'Password123!',
            'full_name': 'Jane Applicant',
            'phone': '1234567890'
        }
        reg_res = self.client.post(self.register_url, reg_data)
        self.assertEqual(reg_res.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', reg_res.data)
        token = reg_res.data['token']

        # Verify DB hash and verify account for testing applications
        candidate_db = CandidateAccount.objects.get(email='candidate@test.com')
        self.assertTrue(check_password('Password123!', candidate_db.password))
        candidate_db.is_verified = True
        candidate_db.save()

        # Step 2: Login
        login_data = {
            'email': 'candidate@test.com',
            'password': 'Password123!'
        }
        login_res = self.client.post(self.login_url, login_data)
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn('token', login_res.data)

        # Step 3: View Jobs Catalogue
        jobs_res = self.client.get(self.jobs_url)
        self.assertEqual(jobs_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(jobs_res.data), 1)
        self.assertEqual(jobs_res.data[0]['title'], "Senior React Engineer")

        # Step 4: Apply to Job
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        apply_data = {
            'job_requisition_id': self.job.id,
            'current_company': 'Previous Tech Corp',
            'current_designation': 'Frontend Developer',
            'cover_letter': 'Excited to apply!'
        }
        apply_res = self.client.post(self.apply_url, apply_data)
        self.assertEqual(apply_res.status_code, status.HTTP_201_CREATED)

        # Verify Candidate application table reflects it
        self.assertTrue(Candidate.objects.filter(job_requisition=self.job, email='candidate@test.com').exists())

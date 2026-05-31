import os
import django
import sys
import time

# Setup django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from notifications.tasks import dispatch_email

def test_send():
    print("Testing TalentPulse SMTP email dispatch...")
    recipient = "pixora90@gmail.com"
    # Call dispatch_email which will run asynchronously in Celery or background daemon thread fallback
    dispatch_email(
        'send_verification_email',
        recipient,
        'Test Candidate Name',
        'test-verification-token-xyz-123',
        '889977'
    )
    print("Email dispatch queued! Waiting 10 seconds to allow delivery...")
    time.sleep(10)
    print("Test complete.")

if __name__ == '__main__':
    test_send()

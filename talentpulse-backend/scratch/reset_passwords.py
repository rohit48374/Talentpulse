import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Target accounts to reset to Password123
target_emails = [
    '22000308001aids@gmail.com', # HR: Jignyas Naidu
    '2200030564cseh@gmail.com', # Admin: Gavara Karteek
    '2200031781cseh@gmail.com'  # Admin: riyaz shaik
]

print("--- Resetting Passwords to 'Password123' ---")
for email in target_emails:
    try:
        user = User.objects.get(email=email)
        user.set_password('Password123')
        user.save()
        print(f"[OK] Password successfully reset for: {user.full_name} ({user.email}) - Role: {user.role}")
    except User.DoesNotExist:
        print(f"[ERR] User with email {email} not found.")

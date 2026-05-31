import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

admin_user = User.objects.filter(role='admin').first()
if admin_user:
    print(f"Admin User ID: {admin_user.id}")
    print(f"Email: {admin_user.email}")
    print(f"Full Name: {admin_user.full_name}")
    print(f"Profile Image Field: '{admin_user.profile_image}'")
    if admin_user.profile_image:
        print(f"Profile Image URL: '{admin_user.profile_image.url}'")
    print(f"Address: '{admin_user.address}'")
else:
    print("No Admin user found!")

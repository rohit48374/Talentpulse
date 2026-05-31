"""
Standalone DB migration script to update legacy role values to consolidated ones.
"""
import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from dashboard.models import DashboardCard

User = get_user_model()


def run_migration():
    print("Starting role data migration in the SQLite database...")

    # 1. Migrate Users
    role_mapping = {
        'hrbp': 'hr',
        'hr_admin': 'admin',
        'super_admin': 'admin'
    }

    user_count = 0
    for old_role, new_role in role_mapping.items():
        users = User.objects.filter(role=old_role)
        count = users.count()
        if count > 0:
            users.update(role=new_role)
            print(f"[OK] Migrated {count} users from '{old_role}' to '{new_role}'")
            user_count += count

    # 2. Migrate Dashboard Cards
    card_count = 0
    for old_role, new_role in role_mapping.items():
        cards = DashboardCard.objects.filter(applicable_role=old_role)
        count = cards.count()
        if count > 0:
            cards.update(applicable_role=new_role)
            print(f"[OK] Migrated {count} DashboardCards from '{old_role}' to '{new_role}'")
            card_count += count

    print(f"Migration finished. Successfully updated {user_count} users and {card_count} dashboard cards.")


if __name__ == '__main__':
    run_migration()

"""
Management command: create_admin
Creates the first superuser / admin account for Hirevant HRMS.

Usage:
    python manage.py create_admin
    python manage.py create_admin --username admin --email admin@company.com --password secret123

If arguments are not provided the command will prompt interactively.
"""

import getpass
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates the Hirevant admin superuser with all required HRMS fields.'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, help='Admin username')
        parser.add_argument('--email', type=str, help='Admin email address')
        parser.add_argument('--password', type=str, help='Admin password (use only for scripted setups)')
        parser.add_argument('--fullname', type=str, help='Admin full name', default='System Administrator')

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('\n=== Hirevant Admin Setup ===\n'))

        username = options.get('username') or input('Username [admin]: ').strip() or 'admin'
        email = options.get('email') or input('Email address: ').strip()
        full_name = options.get('fullname') or input('Full name [System Administrator]: ').strip() or 'System Administrator'

        if not email:
            self.stderr.write(self.style.ERROR('Email is required.'))
            return

        if User.objects.filter(username=username).exists():
            self.stderr.write(self.style.WARNING(f'User "{username}" already exists. Skipping creation.'))
            # Still make sure the existing user is a superuser + admin role
            user = User.objects.get(username=username)
            if not user.is_superuser or user.role != 'admin':
                user.is_superuser = True
                user.is_staff = True
                user.role = 'admin'
                user.save(update_fields=['is_superuser', 'is_staff', 'role'])
                self.stdout.write(self.style.SUCCESS(f'Promoted "{username}" to superuser / admin role.'))
            return

        # Password prompt (hidden input)
        if options.get('password'):
            password = options['password']
        else:
            while True:
                password = getpass.getpass('Password: ')
                confirm = getpass.getpass('Password (again): ')
                if password == confirm:
                    break
                self.stderr.write(self.style.ERROR("Passwords don't match, try again."))

        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
        )
        user.full_name = full_name
        user.role = 'admin'
        user.status = 'active'
        user.is_staff = True
        user.is_superuser = True
        user.save(update_fields=['full_name', 'role', 'status', 'is_staff', 'is_superuser'])

        self.stdout.write(self.style.SUCCESS(
            f'\n[OK] Admin user created successfully!\n'
            f'     Username : {username}\n'
            f'     Email    : {email}\n'
            f'     Role     : admin (superuser)\n'
            f'\nYou can now log in at /admin/ or through the HRMS dashboard.\n'
        ))

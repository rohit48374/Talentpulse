"""
TalentPulse HRMS - Comprehensive Setup & Installation Guide
========================================================

This document provides a complete guide to set up and deploy the TalentPulse HRMS backend.

TABLE OF CONTENTS
1. Project Overview
2. System Requirements
3. Installation Steps
4. Configuration
5. Database Setup
6. Running the Application
7. API Documentation
8. Deployment Guide
9. Security Best Practices
10. Troubleshooting

================================================================================
1. PROJECT OVERVIEW
================================================================================

TalentPulse is a comprehensive Human Resource Management System (HRMS) built with:
- Backend: Django 6.0+ with Django REST Framework
- Database: SQLite (development), PostgreSQL (production)
- Authentication: JWT (JSON Web Tokens)

Modules Included:
- Accounts: User management and authentication
- Employees: Employee data, profiles, education, experience, skills
- Recruitment: Job requisitions, candidates, interviews, offers
- Attendance: Leave management, attendance tracking, check-in/out
- Payroll: Salary structures, payroll runs, payslips, bonuses
- Appraisal: Performance appraisals, goals, promotions
- Analytics: KPI tracking and department analytics
- Notifications: User notifications and preferences
- Dashboard: Role-based dashboards and widgets

================================================================================
2. SYSTEM REQUIREMENTS
================================================================================

Software Requirements:
- Python 3.10+
- pip (Python package manager)
- PostgreSQL 12+ (production)
- Redis (optional, for caching)

Recommended System Specs:
- CPU: 2+ cores
- RAM: 4GB minimum
- Disk Space: 20GB minimum

================================================================================
3. INSTALLATION STEPS
================================================================================

Step 1: Clone the Repository
-----------------------------
git clone <repository-url>
cd talentpulse-backend

Step 2: Create Virtual Environment
-----------------------------------
# Windows
python -m venv venv-v2
venv-v2\\Scripts\\activate

# macOS/Linux
python3 -m venv venv-v2
source venv-v2/bin/activate

Step 3: Install Dependencies
-----------------------------
pip install -r requirements.txt

Step 4: Create Environment File
-------------------------------
Copy .env.example to .env and update with your settings:

# Environment
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=talentpulse_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_SECRET_KEY=your-jwt-secret-key
JWT_EXPIRATION_HOURS=24

# Email (for notifications)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

================================================================================
4. CONFIGURATION
================================================================================

A. Settings Configuration (config/settings.py)

Key settings to configure:

DEBUG = False  # Set to False in production

DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.sqlite3'),
        'NAME': os.getenv('DB_NAME', BASE_DIR / 'db.sqlite3'),
    }
}

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    
    # Custom apps
    'accounts.apps.AccountsConfig',
    'employees.apps.EmployeesConfig',
    'recruitment.apps.RecruitmentConfig',
    'attendance.apps.AttendanceConfig',
    'payroll.apps.PayrollConfig',
    'appraisal.apps.AppraisalConfig',
    'analytics.apps.AnalyticsConfig',
    'notifications.apps.NotificationsConfig',
    'dashboard.apps.DashboardConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'core.middleware.AuditMiddleware',
]

B. REST Framework Configuration

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'core.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 25,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}

C. JWT Configuration

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': settings.SECRET_KEY,
}

================================================================================
5. DATABASE SETUP
================================================================================

Step 1: Create Database
-----------------------
# For PostgreSQL
createdb talentpulse_db

Step 2: Run Migrations
----------------------
python manage.py makemigrations
python manage.py migrate

Step 3: Create Superuser
------------------------
python manage.py createsuperuser
# Follow prompts to create admin account

Step 4: Create Initial Data (Optional)
--------------------------------------
python manage.py loaddata initial_data.json

Step 5: Verify Database
-----------------------
python manage.py dbshell

================================================================================
6. RUNNING THE APPLICATION
================================================================================

Development Server:
-------------------
python manage.py runserver

Access admin panel: http://localhost:8000/admin
API endpoints: http://localhost:8000/api/

Test API:
---------
# Login and get token
curl -X POST http://localhost:8000/api/token/ \\
  -H "Content-Type: application/json" \\
  -d '{"email": "admin@example.com", "password": "password"}'

# Use token in subsequent requests
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/employees/departments/

================================================================================
7. API DOCUMENTATION
================================================================================

Authentication Endpoints:
- POST /api/token/ - Obtain JWT token
- POST /api/token/refresh/ - Refresh JWT token
- POST /api/accounts/register/ - Register new user
- GET /api/accounts/me/ - Get current user info

Employees Module:
- GET/POST /api/employees/departments/ - Department management
- GET/POST /api/employees/designations/ - Designation management
- GET/POST /api/employees/grades/ - Grade structure
- GET/POST /api/employees/profiles/ - Employee profiles
- GET/POST /api/employees/education/ - Education history
- GET/POST /api/employees/experience/ - Work experience
- GET/POST /api/employees/skills/ - Skills

Recruitment Module:
- GET/POST /api/recruitment/job-requisitions/ - Job postings
- GET/POST /api/recruitment/candidates/ - Candidate management
- GET/POST /api/recruitment/interview-rounds/ - Interview tracking
- GET/POST /api/recruitment/offer-letters/ - Offer management

Attendance Module:
- GET /api/attendance/leave-types/ - Leave types
- GET /api/attendance/leave-balances/ - Leave balances
- GET/POST /api/attendance/leave-applications/ - Leave requests
- GET/POST /api/attendance/attendance/ - Attendance records
- POST /api/attendance/check-in-out/check_in/ - Check-in
- POST /api/attendance/check-in-out/check_out/ - Check-out

Payroll Module:
- GET/POST /api/payroll/salary-structures/ - Salary management
- GET/POST /api/payroll/payroll-runs/ - Payroll processing
- GET /api/payroll/payslips/ - Payslip view
- GET/POST /api/payroll/bonuses/ - Bonus management

Appraisal Module:
- GET/POST /api/appraisal/cycles/ - Appraisal cycles
- GET/POST /api/appraisal/goals/ - Goal setting
- GET/POST /api/appraisal/appraisals/ - Performance appraisals
- GET/POST /api/appraisal/promotions/ - Promotion management

Analytics Module:
- GET /api/analytics/snapshots/ - Analytics snapshots
- GET /api/analytics/department/ - Department analytics

Notifications Module:
- GET /api/notifications/ - Notifications
- GET /api/notifications/preferences/ - User preferences

Dashboard Module:
- GET /api/dashboard/cards/ - Dashboard widgets
- GET /api/dashboard/summary/ - Dashboard summary

================================================================================
8. DEPLOYMENT GUIDE
================================================================================

Production Deployment Checklist:
1. Set DEBUG = False
2. Update SECRET_KEY with strong random value
3. Configure ALLOWED_HOSTS with domain names
4. Use PostgreSQL instead of SQLite
5. Set up environment variables securely
6. Configure HTTPS/SSL
7. Set up CORS properly
8. Use Gunicorn/uWSGI as application server
9. Use Nginx as reverse proxy
10. Set up logging and monitoring
11. Configure backups for database
12. Set up rate limiting
13. Enable CSRF protection
14. Use secure cookie settings

Deployment with Docker:
-----------------------
1. Create Dockerfile
2. Create docker-compose.yml
3. Build image: docker build -t talentpulse-backend .
4. Run container: docker-compose up -d

Sample Gunicorn Command:
------------------------
gunicorn config.wsgi:application \\
  --bind 0.0.0.0:8000 \\
  --workers 4 \\
  --worker-class sync \\
  --timeout 30

Sample Nginx Configuration:
---------------------------
upstream talentpulse {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location /api {
        proxy_pass http://talentpulse;
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
    }
    
    location /static/ {
        alias /path/to/static/;
    }
    
    location /media/ {
        alias /path/to/media/;
    }
}

================================================================================
9. SECURITY BEST PRACTICES
================================================================================

1. Authentication & Authorization
   - Use strong passwords
   - Implement role-based access control (RBAC)
   - Use JWT with short expiration times
   - Implement refresh token rotation

2. Database Security
   - Use environment variables for credentials
   - Enable database encryption
   - Regular backups
   - Principle of least privilege for DB user

3. API Security
   - Enable HTTPS/TLS
   - Implement rate limiting
   - Use CORS appropriately
   - Validate all input data
   - Implement CSRF protection

4. Code Security
   - Regular security audits
   - Dependency updates
   - SQL injection prevention (use ORM)
   - XSS protection
   - CSRF tokens

5. Infrastructure Security
   - Firewall configuration
   - VPN for sensitive operations
   - Monitoring and logging
   - Regular security patches
   - Secrets management (use AWS Secrets Manager, etc.)

6. Compliance
   - Data privacy (GDPR, etc.)
   - Audit logging
   - Access controls
   - Data retention policies

================================================================================
10. TROUBLESHOOTING
================================================================================

Common Issues and Solutions:

1. Migration Errors
   - Clear migration files and run makemigrations again
   - Check for circular imports
   - Ensure models are properly registered in INSTALLED_APPS

2. Authentication Issues
   - Verify JWT_SECRET_KEY is set
   - Check token expiration
   - Verify CORS settings
   - Ensure Content-Type: application/json in requests

3. Database Connection Issues
   - Verify database is running
   - Check connection string in .env
   - Ensure database user has proper permissions
   - Check firewall settings if remote database

4. Permission Denied Errors
   - Check permission_classes in ViewSets
   - Verify user has proper role
   - Check RBAC implementation

5. Performance Issues
   - Enable database query optimization
   - Implement caching (Redis)
   - Use select_related() and prefetch_related()
   - Add database indexes
   - Monitor slow queries

Support & Documentation:
- Django Documentation: https://docs.djangoproject.com/
- DRF Documentation: https://www.django-rest-framework.org/
- JWT Documentation: https://django-rest-framework-simplejwt.readthedocs.io/

================================================================================

For additional help and updates, refer to the project repository and documentation.
Last Updated: May 2026
"""

# This guide should be saved as SETUP_GUIDE.md in the project root

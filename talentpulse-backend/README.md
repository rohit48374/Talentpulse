# TalentPulse HRMS - Comprehensive Project README

![TalentPulse](https://img.shields.io/badge/TalentPulse-HRMS-brightgreen)
![Django](https://img.shields.io/badge/Django-6.0+-blue)
![Python](https://img.shields.io/badge/Python-3.10+-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Overview

TalentPulse is a comprehensive, enterprise-level Human Resource Management System (HRMS) built with Django and Django REST Framework. It provides a complete solution for managing employee information, recruitment, attendance, payroll, performance appraisals, and more.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-Based Access Control (RBAC) with 7 roles
- User management and profile management
- Audit logging for all operations
- Secure password hashing

### 👥 Employee Management
- Complete employee profiles with education and experience tracking
- Organizational structure (departments, designations, grades)
- Skills management and proficiency levels
- Employee directory with advanced search
- Reporting hierarchy management

### 💼 Recruitment Module
- Job requisition management
- Candidate tracking and pipeline management
- Multi-round interview scheduling and feedback
- Offer letter generation and management
- Recruitment analytics

### 📅 Attendance & Leave Management
- Leave type configuration (casual, sick, annual, maternity, etc.)
- Leave balance tracking by financial year
- Leave application workflow with approval process
- Attendance tracking (daily, check-in/check-out)
- Location-based check-in with GPS coordinates

### 💰 Payroll Management
- Salary structure definition
- Monthly payroll processing
- Automatic payslip generation
- Bonus management
- Payroll approval workflow
- Compliance with tax regulations

### 📊 Performance Management
- Appraisal cycle management
- Goal setting and tracking
- Performance ratings and feedback
- Self and manager appraisals
- Promotion recommendations

### 📈 Analytics & Reporting
- Real-time KPI snapshots
- Department-wise analytics
- Attrition rate tracking
- Attendance and engagement metrics
- Payroll summaries

### 🔔 Notifications
- Multi-channel notifications (in-app, email)
- User-specific notification preferences
- Event-based notifications
- Notification history

### 📱 Dashboard
- Role-based dashboards
- Customizable widgets
- Quick links to important functions
- Real-time status updates

## System Requirements

### Software
- Python 3.10 or higher
- PostgreSQL 12+ (for production)
- Redis (optional, for caching)
- Git

### Recommended Hardware
- CPU: 2+ cores
- RAM: 4GB minimum
- Disk Space: 20GB

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/talentpulse-hrms.git
cd talentpulse-backend
```

### 2. Create Virtual Environment
```bash
# Windows
python -m venv venv-v2
venv-v2\Scripts\activate

# macOS/Linux
python3 -m venv venv-v2
source venv-v2/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Create Environment File
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 5. Database Setup
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_initial_data
```

### 6. Run Development Server
```bash
python manage.py runserver
```

Access the application:
- API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/
- API Schema: http://localhost:8000/api/schema/

## Project Structure

```
talentpulse-backend/
├── config/                 # Project configuration
│   ├── settings.py        # Django settings
│   ├── urls.py           # Main URL routing
│   ├── wsgi.py           # WSGI configuration
│   └── asgi.py           # ASGI configuration
│
├── core/                  # Core utilities
│   ├── pagination.py      # Custom pagination classes
│   ├── permissions.py     # Custom permission classes
│   ├── utils.py          # Helper functions
│   └── middleware.py     # Custom middleware
│
├── accounts/             # User authentication & management
│   ├── models.py         # User and AuditLog models
│   ├── serializers.py    # Serializers for users and audit logs
│   ├── views.py          # Authentication and user management views
│   ├── urls.py           # App URL routing
│   ├── admin.py          # Django admin configuration
│   └── signals.py        # User signal handlers
│
├── employees/            # Employee management
│   ├── models.py         # Department, Designation, EmployeeProfile, etc.
│   ├── serializers.py    # Serializers for employee data
│   ├── views.py          # Employee management views
│   ├── urls.py           # App URL routing
│   └── admin.py          # Django admin configuration
│
├── recruitment/          # Recruitment module
│   ├── models.py         # JobRequisition, Candidate, Interview, OfferLetter
│   ├── serializers.py    # Recruitment serializers
│   ├── views.py          # Recruitment views
│   ├── urls.py           # App URL routing
│   └── admin.py          # Django admin configuration
│
├── attendance/           # Attendance & Leave management
│   ├── models.py         # Leave types, balances, applications, attendance
│   ├── serializers.py    # Attendance serializers
│   ├── views.py          # Attendance views
│   ├── urls.py           # App URL routing
│   └── admin.py          # Django admin configuration
│
├── payroll/              # Payroll management
│   ├── models.py         # Salary structures, payroll runs, payslips
│   ├── serializers.py    # Payroll serializers
│   ├── views.py          # Payroll views
│   ├── urls.py           # App URL routing
│   └── admin.py          # Django admin configuration
│
├── appraisal/            # Performance management
│   ├── models.py         # Appraisal cycles, goals, reviews
│   ├── serializers.py    # Appraisal serializers
│   ├── views.py          # Appraisal views
│   ├── urls.py           # App URL routing
│   └── admin.py          # Django admin configuration
│
├── analytics/            # Analytics & Reporting
│   ├── models.py         # Analytics snapshots
│   ├── serializers.py    # Analytics serializers
│   ├── views.py          # Analytics views
│   ├── urls.py           # App URL routing
│   └── admin.py          # Django admin configuration
│
├── notifications/        # Notification system
│   ├── models.py         # Notifications and preferences
│   ├── serializers.py    # Notification serializers
│   ├── views.py          # Notification views
│   ├── urls.py           # App URL routing
│   └── admin.py          # Django admin configuration
│
├── dashboard/            # Dashboard module
│   ├── models.py         # Dashboard cards configuration
│   ├── serializers.py    # Dashboard serializers
│   ├── views.py          # Dashboard views
│   ├── urls.py           # App URL routing
│   └── admin.py          # Django admin configuration
│
├── manage.py            # Django management script
├── requirements.txt     # Project dependencies
├── .env.example        # Example environment variables
├── API_DOCUMENTATION.md # API documentation
├── SETUP_GUIDE.md      # Setup and installation guide
└── README.md           # This file
```

## Key Technologies

- **Framework:** Django 6.0+
- **REST API:** Django REST Framework 3.14+
- **Authentication:** djangorestframework-simplejwt
- **Database:** PostgreSQL (production), SQLite (development)
- **ORM:** Django ORM
- **File Storage:** Local storage / AWS S3
- **Caching:** Redis (optional)
- **Task Queue:** Celery (optional)

## API Endpoints

### Authentication
- `POST /api/token/` - Obtain JWT token
- `POST /api/token/refresh/` - Refresh token

### Accounts
- `POST /api/accounts/users/register/` - User registration
- `POST /api/accounts/users/login/` - User login
- `GET /api/accounts/users/profile/` - Get current user profile

### Employees
- `GET /api/employees/departments/` - List departments
- `GET /api/employees/designations/` - List designations
- `GET /api/employees/profiles/` - List employee profiles

### Recruitment
- `GET /api/recruitment/job-requisitions/` - List job openings
- `GET /api/recruitment/candidates/` - List candidates
- `GET /api/recruitment/interview-rounds/` - List interviews

### Attendance
- `POST /api/attendance/leave-applications/` - Apply for leave
- `GET /api/attendance/attendance/` - View attendance records
- `POST /api/attendance/check-in-out/check_in/` - Employee check-in

### Payroll
- `GET /api/payroll/payslips/` - View payslips
- `POST /api/payroll/payroll-runs/` - Create payroll run

### Appraisal
- `POST /api/appraisal/appraisals/` - Submit appraisal
- `GET /api/appraisal/appraisals/` - View appraisals

### Analytics
- `GET /api/analytics/snapshots/` - Get KPI snapshots

### Notifications
- `GET /api/notifications/` - View notifications

For complete API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## Role-Based Access Control

### 7 User Roles
1. **Employee** - Can view own data, apply for leave, submit appraisals
2. **Manager** - Can manage team, approve leaves, review appraisals
3. **HR/BP** - Full HR operations, recruitment, employee data
4. **Payroll** - Can process payroll, view salary data
5. **Recruiter** - Manage recruitment process, interviews, offers
6. **HR Admin** - Can manage HR configurations, users, departments
7. **Super Admin** - Full system access, administrative functions

## Configuration

### Environment Variables
Create a `.env` file based on `.env.example`:

```env
DEBUG=False
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/talentpulse
JWT_EXPIRATION_HOURS=24
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## Running Tests

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test accounts

# Run with verbose output
python manage.py test --verbose=2

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

## Deployment

### Using Gunicorn
```bash
pip install gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

### Using Docker
```bash
docker build -t talentpulse .
docker run -p 8000:8000 talentpulse
```

### Production Checklist
- [ ] Set DEBUG = False
- [ ] Configure strong SECRET_KEY
- [ ] Set up PostgreSQL database
- [ ] Configure HTTPS/SSL
- [ ] Set up email configuration
- [ ] Configure CORS properly
- [ ] Set up logging and monitoring
- [ ] Configure backups
- [ ] Set up rate limiting
- [ ] Enable CSRF protection

## Security Features

- ✅ JWT authentication with token rotation
- ✅ Role-Based Access Control (RBAC)
- ✅ Audit logging of all operations
- ✅ Secure password hashing (PBKDF2)
- ✅ CORS protection
- ✅ CSRF protection
- ✅ SQL injection prevention (ORM)
- ✅ XSS protection
- ✅ Rate limiting
- ✅ Input validation

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, and suggestions:
- Create an issue on GitHub
- Email: support@talentpulse.com
- Documentation: See [SETUP_GUIDE.md](SETUP_GUIDE.md) and [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Workflow automation
- [ ] Integration with external APIs
- [ ] Document management system
- [ ] Time tracking module
- [ ] Performance analytics
- [ ] Multi-language support

## Changelog

### Version 1.0.0 (2024)
- Initial release with core modules
- 9 integrated modules
- JWT authentication
- RBAC implementation
- Complete API documentation

## Authors

- **Your Name** - Initial development

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** Production Ready ✅

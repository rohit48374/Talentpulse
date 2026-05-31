# TalentPulse HRMS - Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Python 3.10+
- pip
- Git

### Step 1: Clone & Setup (2 minutes)
```bash
git clone <repository-url>
cd talentpulse-backend
python -m venv venv-v2
source venv-v2/bin/activate  # or venv-v2\Scripts\activate on Windows
pip install -r requirements.txt
```

### Step 2: Database Setup (1 minute)
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_initial_data
```

### Step 3: Start Server (1 minute)
```bash
python manage.py runserver
```

### Step 4: Access Application (1 minute)
- **Admin Panel:** http://localhost:8000/admin
  - Login with superuser credentials created above
- **API Root:** http://localhost:8000/api/
- **API Schema:** http://localhost:8000/api/schema/

## First API Calls

### 1. Get JWT Token
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-password"
  }'
```

**Response:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 2. List Departments (using token)
```bash
curl -H "Authorization: Bearer <access-token>" \
  http://localhost:8000/api/employees/departments/
```

### 3. Create Department
```bash
curl -X POST http://localhost:8000/api/employees/departments/ \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering",
    "description": "Product Development Team",
    "budget": 1000000
  }'
```

### 4. List Employees
```bash
curl -H "Authorization: Bearer <access-token>" \
  http://localhost:8000/api/employees/profiles/
```

## Common Tasks

### Register New User
```bash
curl -X POST http://localhost:8000/api/accounts/users/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "full_name": "John Doe",
    "phone": "9876543210"
  }'
```

### Apply for Leave
```bash
curl -X POST http://localhost:8000/api/attendance/leave-applications/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "leave_type": 1,
    "start_date": "2024-12-24",
    "end_date": "2024-12-26",
    "reason": "Personal vacation"
  }'
```

### View Payslips
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/payroll/payslips/
```

## Admin Panel Features

Once logged in to http://localhost:8000/admin/:

1. **User Management** → Manage users, roles, and permissions
2. **Employees** → View and manage employee data
3. **Departments** → Create and manage departments
4. **Leave Types** → Configure available leave types
5. **Salary Structures** → Set employee salary information
6. **Recruitment** → Manage job postings and candidates
7. **Payroll** → Process payroll and generate payslips
8. **Appraisals** → Manage performance reviews

## Troubleshooting

### Port 8000 Already in Use
```bash
python manage.py runserver 8001
```

### Database Errors
```bash
python manage.py migrate --run-syncdb
```

### Missing Dependencies
```bash
pip install -r requirements.txt --upgrade
```

### Clear Cache
```bash
python manage.py clear_cache
```

## Next Steps

1. **Read Full Documentation:** See [README.md](README.md)
2. **API Documentation:** See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
3. **Setup Guide:** See [SETUP_GUIDE.md](SETUP_GUIDE.md)
4. **Connect Frontend:** Configure CORS and connect your React/Vue app

## Quick API Testing with HTTPie

If you prefer HTTPie over curl:
```bash
http POST localhost:8000/api/token/ \
  email=admin@example.com password=yourpassword

http --auth-type bearer --auth <token> \
  http://localhost:8000/api/employees/departments/
```

## Docker Quick Start (Optional)

```bash
docker-compose up -d
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser
```

Access at http://localhost:8000

---

**Need Help?**
- Check logs: `python manage.py shell`
- View database: Use pgAdmin or sqlite3 client
- API Schema: Visit http://localhost:8000/api/schema/
- Documentation: Read [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

**Ready to Deploy?**
See [SETUP_GUIDE.md](SETUP_GUIDE.md) for production deployment steps.

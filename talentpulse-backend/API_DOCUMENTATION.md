# TalentPulse HRMS - Comprehensive API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Accounts Module](#accounts-module)
3. [Employees Module](#employees-module)
4. [Recruitment Module](#recruitment-module)
5. [Attendance Module](#attendance-module)
6. [Payroll Module](#payroll-module)
7. [Appraisal Module](#appraisal-module)
8. [Analytics Module](#analytics-module)
9. [Notifications Module](#notifications-module)
10. [Dashboard Module](#dashboard-module)
11. [Error Handling](#error-handling)
12. [Rate Limiting](#rate-limiting)

---

## Authentication

### Obtain JWT Token
**Endpoint:** `POST /api/token/`

```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Refresh Access Token
**Endpoint:** `POST /api/token/refresh/`

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Using JWT in Requests
Include the access token in the Authorization header:
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

---

## Accounts Module

### User Registration
**Endpoint:** `POST /api/accounts/users/register/`

```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "full_name": "John Doe",
  "phone": "9876543210"
}
```

### User Login
**Endpoint:** `POST /api/accounts/users/login/`

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:** Returns JWT tokens

### User Logout
**Endpoint:** `POST /api/accounts/users/logout/`

**Authentication Required:** Yes

### Get Current User Profile
**Endpoint:** `GET /api/accounts/users/profile/`

**Authentication Required:** Yes

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "employee_id": "EMP001",
  "role": "employee",
  "department": "Engineering",
  "designation": "Software Engineer",
  "status": "active"
}
```

### Update User Profile
**Endpoint:** `PUT /api/accounts/users/update_profile/`

**Authentication Required:** Yes

```json
{
  "full_name": "John Doe Updated",
  "phone": "9876543210",
  "address": "123 Main St, City"
}
```

### Change Password
**Endpoint:** `POST /api/accounts/users/change_password/`

**Authentication Required:** Yes

```json
{
  "old_password": "currentpassword",
  "new_password": "newpassword123",
  "new_password_confirm": "newpassword123"
}
```

### Get Audit Logs
**Endpoint:** `GET /api/accounts/audit-logs/`

**Authentication Required:** Yes

**Query Parameters:**
- `user_id`: Filter by user
- `action`: Filter by action (create, update, delete)
- `model_name`: Filter by model

---

## Employees Module

### List Departments
**Endpoint:** `GET /api/employees/departments/`

**Query Parameters:**
- `search`: Search by name or description
- `ordering`: Sort by field (name, created_at)
- `page`: Page number

### Create Department
**Endpoint:** `POST /api/employees/departments/`

```json
{
  "name": "Engineering",
  "description": "Product Development",
  "head": 5,
  "budget": 1000000
}
```

### List Designations
**Endpoint:** `GET /api/employees/designations/`

**Query Parameters:**
- `department`: Filter by department ID
- `search`: Search by name

### Create Designation
**Endpoint:** `POST /api/employees/designations/`

```json
{
  "name": "Senior Engineer",
  "description": "Lead technical initiatives",
  "department": 1,
  "grade": "A",
  "salary_range_min": 80000,
  "salary_range_max": 120000
}
```

### List Grade Structures
**Endpoint:** `GET /api/employees/grades/`

### Create Grade Structure
**Endpoint:** `POST /api/employees/grades/`

```json
{
  "grade": "A",
  "level": 1,
  "base_salary": 50000,
  "description": "Entry level"
}
```

### List Employee Profiles
**Endpoint:** `GET /api/employees/profiles/`

**Query Parameters:**
- `department`: Filter by department
- `designation`: Filter by designation
- `gender`: Filter by gender
- `search`: Search by email or name

### Create/Update Employee Profile
**Endpoint:** `POST/PUT /api/employees/profiles/`

```json
{
  "user": 1,
  "department": 1,
  "designation": 1,
  "grade": "A",
  "reporting_manager": 5,
  "gender": "M",
  "date_of_birth": "1990-01-01",
  "contact_number": "9876543210",
  "personal_email": "personal@example.com",
  "emergency_contact": "Jane Doe",
  "emergency_phone": "9876543211",
  "office_location": "New York",
  "pan_number": "ABCDE1234F",
  "aadhar_number": "123456789012",
  "passport_number": "A12345678"
}
```

### Add Education History
**Endpoint:** `POST /api/employees/education/`

```json
{
  "employee": 1,
  "institution": "MIT",
  "qualification": "Bachelor of Science",
  "field_of_study": "Computer Science",
  "start_date": "2010-09-01",
  "end_date": "2014-05-31",
  "grade_or_score": "3.8"
}
```

### Add Work Experience
**Endpoint:** `POST /api/employees/experience/`

```json
{
  "employee": 1,
  "company_name": "Tech Corp",
  "designation": "Software Engineer",
  "start_date": "2014-06-01",
  "end_date": "2018-12-31",
  "description": "Developed web applications"
}
```

### Add Skills
**Endpoint:** `POST /api/employees/skills/`

```json
{
  "employee": 1,
  "skill_name": "Python",
  "proficiency": "expert",
  "years_of_experience": 5
}
```

---

## Recruitment Module

### List Job Requisitions
**Endpoint:** `GET /api/recruitment/job-requisitions/`

**Query Parameters:**
- `status`: Filter by status (draft, open, closed, on_hold)
- `department`: Filter by department
- `search`: Search by title

### Create Job Requisition
**Endpoint:** `POST /api/recruitment/job-requisitions/`

```json
{
  "title": "Senior Developer",
  "description": "Lead development team",
  "department": "Engineering",
  "designation": "Senior Developer",
  "position_count": 2,
  "salary_range_min": 100000,
  "salary_range_max": 150000,
  "status": "open"
}
```

### List Candidates
**Endpoint:** `GET /api/recruitment/candidates/`

**Query Parameters:**
- `status`: Filter by status
- `job_requisition`: Filter by job ID
- `search`: Search by email or name

### Create Candidate Application
**Endpoint:** `POST /api/recruitment/candidates/`

```json
{
  "job_requisition": 1,
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "phone": "9876543210",
  "current_company": "Previous Corp",
  "current_designation": "Developer",
  "resume": "<file>",
  "cover_letter": "I am interested in this role..."
}
```

### Schedule Interview
**Endpoint:** `POST /api/recruitment/interview-rounds/`

```json
{
  "candidate": 1,
  "interview_type": "technical",
  "interviewer": 5,
  "scheduled_date": "2024-12-20T10:00:00Z",
  "status": "scheduled"
}
```

### Add Interview Feedback
**Endpoint:** `PUT /api/recruitment/interview-rounds/{id}/`

```json
{
  "status": "completed",
  "feedback": "Strong technical skills",
  "rating": 4
}
```

### Create Offer Letter
**Endpoint:** `POST /api/recruitment/offer-letters/`

```json
{
  "candidate": 1,
  "position_title": "Senior Developer",
  "salary": 120000,
  "start_date": "2024-01-15",
  "offer_validity": "2024-12-31",
  "document": "<file>",
  "status": "sent"
}
```

---

## Attendance Module

### List Leave Types
**Endpoint:** `GET /api/attendance/leave-types/`

### Get Leave Balance
**Endpoint:** `GET /api/attendance/leave-balances/`

**Query Parameters:**
- `financial_year`: Filter by financial year
- `leave_type`: Filter by leave type

### Apply for Leave
**Endpoint:** `POST /api/attendance/leave-applications/`

```json
{
  "leave_type": 1,
  "start_date": "2024-12-24",
  "end_date": "2024-12-26",
  "reason": "Personal vacation"
}
```

### Get Leave Applications
**Endpoint:** `GET /api/attendance/leave-applications/`

**Query Parameters:**
- `status`: Filter by status (pending, approved, rejected, cancelled)

### Approve/Reject Leave
**Endpoint:** `PUT /api/attendance/leave-applications/{id}/`

```json
{
  "status": "approved",
  "approval_remarks": "Approved"
}
```

### Record Attendance
**Endpoint:** `POST /api/attendance/attendance/`

```json
{
  "employee": 1,
  "date": "2024-12-20",
  "status": "present",
  "check_in_time": "09:00:00",
  "check_out_time": "18:00:00",
  "working_hours": 9
}
```

### Employee Check-in
**Endpoint:** `POST /api/attendance/check-in-out/check_in/`

```json
{
  "location": "Office",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

### Employee Check-out
**Endpoint:** `POST /api/attendance/check-in-out/check_out/`

```json
{
  "location": "Office",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

---

## Payroll Module

### Get Salary Structure
**Endpoint:** `GET /api/payroll/salary-structures/`

### Update Salary Structure
**Endpoint:** `PUT /api/payroll/salary-structures/{id}/`

```json
{
  "base_salary": 50000,
  "hra": 15000,
  "da": 10000,
  "other_allowances": 5000,
  "pf_contribution": 5000,
  "it": 5000,
  "other_deductions": 1000,
  "effective_from": "2024-01-01"
}
```

### Create Payroll Run
**Endpoint:** `POST /api/payroll/payroll-runs/`

```json
{
  "month_year": "2024-12",
  "total_employees": 100,
  "status": "processing"
}
```

### Get Payslips
**Endpoint:** `GET /api/payroll/payslips/`

**Query Parameters:**
- `payroll_run`: Filter by payroll run
- `status`: Filter by status

### Process Payroll
**Endpoint:** `PUT /api/payroll/payroll-runs/{id}/`

```json
{
  "status": "processed",
  "total_gross_salary": 500000,
  "total_deductions": 100000,
  "total_net_salary": 400000
}
```

### Add Bonus
**Endpoint:** `POST /api/payroll/bonuses/`

```json
{
  "employee": 1,
  "bonus_type": "performance",
  "amount": 10000,
  "month_year": "2024-12",
  "status": "pending"
}
```

---

## Appraisal Module

### Create Appraisal Cycle
**Endpoint:** `POST /api/appraisal/cycles/`

```json
{
  "name": "FY 2024-25 Appraisal",
  "description": "Annual performance appraisal",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "status": "active",
  "financial_year": "2024-25"
}
```

### Add Goals
**Endpoint:** `POST /api/appraisal/goals/`

```json
{
  "appraisal_cycle": 1,
  "employee": 1,
  "goal_title": "Complete Project X",
  "goal_description": "Successfully deliver Project X",
  "target_value": 100,
  "weight": 30
}
```

### Submit Self Appraisal
**Endpoint:** `POST /api/appraisal/appraisals/`

```json
{
  "appraisal_cycle": 1,
  "employee": 1,
  "manager": 5,
  "self_rating": 4,
  "self_comments": "I have performed well this year"
}
```

### Manager Review
**Endpoint:** `PUT /api/appraisal/appraisals/{id}/`

```json
{
  "manager_rating": 4,
  "manager_comments": "Good performance",
  "final_rating": 4,
  "performance_remarks": "Meets expectations"
}
```

### Promotion Recommendation
**Endpoint:** `POST /api/appraisal/promotions/`

```json
{
  "employee": 1,
  "appraisal_cycle": 1,
  "current_designation": 1,
  "recommended_designation": 2,
  "reason": "Excellent performance",
  "salary_increment_percentage": 15,
  "effective_date": "2025-01-01"
}
```

---

## Analytics Module

### Get Analytics Snapshot
**Endpoint:** `GET /api/analytics/snapshots/`

### Get Latest Analytics
**Endpoint:** `GET /api/analytics/snapshots/latest/`

**Response:**
```json
{
  "snapshot_date": "2024-12-20",
  "total_employees": 500,
  "active_employees": 480,
  "on_leave_employees": 20,
  "attrition_rate": 5.2,
  "open_positions": 10,
  "average_attendance_rate": 92.5
}
```

### Get Department Analytics
**Endpoint:** `GET /api/analytics/department/`

**Query Parameters:**
- `department_name`: Filter by department

---

## Notifications Module

### Get Notifications
**Endpoint:** `GET /api/notifications/`

**Query Parameters:**
- `status`: Filter by status (unread, read, archived)
- `notification_type`: Filter by type

### Mark as Read
**Endpoint:** `POST /api/notifications/{id}/mark_as_read/`

### Get Unread Count
**Endpoint:** `GET /api/notifications/unread_count/`

**Response:**
```json
{
  "unread_count": 5
}
```

### Get Notification Preferences
**Endpoint:** `GET /api/notifications/preferences/list/`

### Update Preferences
**Endpoint:** `PUT /api/notifications/preferences/update/`

```json
{
  "leave_notifications": "daily",
  "payroll_notifications": "monthly",
  "email_notifications": true,
  "push_notifications": true
}
```

---

## Dashboard Module

### Get Dashboard Cards
**Endpoint:** `GET /api/dashboard/cards/`

**Response:**
```json
[
  {
    "id": 1,
    "title": "Total Employees",
    "card_type": "kpi",
    "applicable_role": "hr_admin",
    "icon": "users"
  }
]
```

### Get Dashboard Summary
**Endpoint:** `GET /api/dashboard/summary/`

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "role": "employee",
    "department": "Engineering"
  },
  "leaves_pending": 2,
  "notifications": 5
}
```

---

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "detail": "Invalid input",
  "errors": {
    "email": ["This field is required"]
  }
}
```

**401 Unauthorized:**
```json
{
  "detail": "Authentication credentials were not provided"
}
```

**403 Forbidden:**
```json
{
  "detail": "You do not have permission to perform this action"
}
```

**404 Not Found:**
```json
{
  "detail": "Not found"
}
```

**500 Internal Server Error:**
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting

Rate limits are applied to prevent abuse:

- **Authenticated Users:** 1000 requests per hour
- **Anonymous Users:** 100 requests per hour

Rate limit information is provided in response headers:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 25, max: 100)

**Response:**
```json
{
  "count": 500,
  "next": "http://api.example.com/api/resource/?page=2",
  "previous": null,
  "results": [...]
}
```

---

## Filtering and Searching

Most endpoints support filtering and searching:

**Filtering:**
```
GET /api/employees/profiles/?department=1&gender=M
```

**Searching:**
```
GET /api/employees/profiles/?search=john
```

**Ordering:**
```
GET /api/employees/profiles/?ordering=-created_at
```

---

## Testing API with cURL

```bash
# Get token
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use token in request
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/employees/departments/

# Create resource
curl -X POST http://localhost:8000/api/employees/departments/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Engineering","description":"Product development"}'
```

---

For detailed endpoint specifications, refer to the API schema at `/api/schema/`

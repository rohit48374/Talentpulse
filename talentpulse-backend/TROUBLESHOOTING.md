# TalentPulse HRMS - Troubleshooting Guide

## Common Issues & Solutions

### Installation & Setup Issues

#### 1. Python Version Incompatibility
**Problem:** `ModuleNotFoundError` or version mismatch errors

**Solution:**
```bash
# Check Python version (should be 3.10+)
python --version

# Use specific Python version
python3.10 -m venv venv-v2
# or
python3.11 -m venv venv-v2
```

#### 2. Virtual Environment Not Activating
**Problem:** `venv-v2` commands not recognized

**Solution:**
```bash
# Windows
venv-v2\Scripts\activate

# macOS/Linux
source venv-v2/bin/activate

# Verify activation (should show venv name in prompt)
which python  # Should show venv path
```

#### 3. Pip Install Failures
**Problem:** `pip install -r requirements.txt` fails

**Solution:**
```bash
# Upgrade pip first
python -m pip install --upgrade pip

# Install with verbose output to see errors
pip install -r requirements.txt -v

# If specific package fails, install it separately
pip install Django==6.0.5
pip install djangorestframework==3.14.0

# Check installed packages
pip list
```

#### 4. Missing Dependencies
**Problem:** `ImportError: No module named 'xxx'`

**Solution:**
```bash
# Check if dependencies are installed
pip list | grep -i django
pip list | grep -i rest

# Reinstall specific package
pip install djangorestframework-simplejwt --upgrade

# Verify with Python
python -c "import rest_framework; print(rest_framework.__version__)"
```

---

### Database Issues

#### 1. Database Connection Errors
**Problem:** `django.db.utils.OperationalError: could not connect to database`

**Solution:**
```bash
# Verify DATABASE settings in .env
cat .env | grep DB_

# For SQLite (development)
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# For PostgreSQL
# Ensure PostgreSQL is running
sudo service postgresql status
sudo service postgresql start

# Check connection string
psql -U postgres -d talentpulse_db -h localhost
```

#### 2. Migration Errors
**Problem:** `django.db.migrations.exceptions.MigrationError`

**Solution:**
```bash
# Show current migration status
python manage.py showmigrations

# Reset migrations (CAREFUL - deletes data)
python manage.py migrate accounts zero
python manage.py migrate

# Re-create migrations
python manage.py makemigrations --empty accounts --name fix_migrations
python manage.py migrate
```

#### 3. "Table Already Exists" Errors
**Problem:** `ProgrammingError: relation "accounts_user" already exists`

**Solution:**
```bash
# Option 1: Use existing database
python manage.py migrate --fake-initial

# Option 2: Delete and recreate (for development)
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

#### 4. Foreign Key Constraint Errors
**Problem:** `django.db.utils.IntegrityError: Foreign key constraint fails`

**Solution:**
```bash
# Check model relationships
python manage.py check

# Verify related objects exist
# In Django shell
python manage.py shell
>>> from accounts.models import User
>>> User.objects.filter(id=1).exists()

# Check for orphaned records
>>> from employees.models import EmployeeProfile
>>> EmployeeProfile.objects.filter(user__isnull=True)
```

---

### Authentication Issues

#### 1. Token Not Working
**Problem:** `401 Unauthorized` when using JWT token

**Solution:**
```bash
# Verify token is valid
# Check token expiration
python -c "import jwt; jwt.decode('YOUR_TOKEN', 'SECRET', algorithms=['HS256'])"

# Get new token
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Check token format in header
Authorization: Bearer <token_here>
```

#### 2. "Invalid Password" Error
**Problem:** Login fails even with correct credentials

**Solution:**
```bash
# Reset password in Django shell
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> user = User.objects.get(email='admin@example.com')
>>> user.set_password('newpassword')
>>> user.save()
```

#### 3. CORS Errors
**Problem:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution:**
```python
# Check config/settings.py
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000'
]

# Verify frontend URL matches exactly
# If using with production domain
CORS_ALLOWED_ORIGINS = [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
]
```

#### 4. Permission Denied Errors
**Problem:** `403 Forbidden` on endpoints that should be accessible

**Solution:**
```bash
# Check user role
python manage.py shell
>>> from accounts.models import User
>>> user = User.objects.get(email='admin@example.com')
>>> print(user.role)  # Should print role (e.g., 'hr_admin')

# Verify permission class
# Check views.py for permission_classes
# Example: permission_classes = [permissions.IsAuthenticated]

# Check user status
>>> print(user.status)  # Should be 'active'
```

---

### API & Serializer Issues

#### 1. Validation Errors
**Problem:** `400 Bad Request` with validation errors

**Solution:**
```bash
# Check error message for specific field
# Response: {"field_name": ["error message"]}

# Validate data format
# Ensure dates are in ISO format: YYYY-MM-DD
# Ensure emails are valid format
# Ensure phone numbers match expected format
```

#### 2. Nested Object Not Returning
**Problem:** Related objects showing as IDs instead of full objects

**Solution:**
```python
# In serializers.py, add related fields
class EmployeeProfileSerializer(serializers.ModelSerializer):
    # Add this for nested object
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = EmployeeProfile
        fields = ['id', 'user', 'user_details', ...]
```

#### 3. File Upload Issues
**Problem:** Files not uploading or showing as missing

**Solution:**
```bash
# Create media directory
mkdir media
mkdir media/resumes
mkdir media/offer_letters
mkdir media/profiles

# Check file permissions
chmod 755 media/

# Verify MEDIA settings in settings.py
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# In development, serve media files
# Add to urls.py:
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

#### 4. Pagination Not Working
**Problem:** Getting all results instead of paginated response

**Solution:**
```bash
# Check query parameter syntax
# Correct: ?page=1&page_size=25
# Wrong: ?page_number=1

# Verify pagination class in views.py
pagination_class = StandardResultsSetPagination

# Override page size if needed
# Add to request: ?page=1&page_size=50
```

---

### Performance Issues

#### 1. Slow Queries
**Problem:** API responses taking too long

**Solution:**
```bash
# Enable query logging
# In settings.py (development only):
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {'class': 'logging.StreamHandler'},
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}

# Run with: python manage.py runserver --verbosity=2

# Use select_related for ForeignKey
queryset = EmployeeProfile.objects.select_related('user', 'department')

# Use prefetch_related for reverse relations
queryset = EmployeeProfile.objects.prefetch_related('education_set')
```

#### 2. Memory Leaks
**Problem:** Memory usage growing over time

**Solution:**
```bash
# Check for circular imports
python -c "import django; django.setup()"

# Monitor with memory profiler
pip install memory-profiler
python -m memory_profiler manage.py runserver
```

#### 3. Large File Handling
**Problem:** Uploading large files fails

**Solution:**
```python
# In settings.py, increase limits
FILE_UPLOAD_MAX_MEMORY_SIZE = 26214400  # 25 MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 26214400

# Or stream larger files
# Implement chunked uploads
```

---

### Production Issues

#### 1. Static Files Not Serving
**Problem:** CSS, JS, images not loading in production

**Solution:**
```bash
# Collect static files
python manage.py collectstatic --no-input

# Verify settings
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATIC_URL = '/static/'

# Configure web server (Nginx)
location /static/ {
    alias /path/to/staticfiles/;
}
```

#### 2. Email Not Sending
**Problem:** Emails not being sent in production

**Solution:**
```python
# In settings.py, verify email settings
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'app-specific-password'  # NOT your Gmail password

# Test email
python manage.py shell
>>> from django.core.mail import send_mail
>>> send_mail('Test', 'Message', 'from@example.com', ['to@example.com'])
```

#### 3. Debug Mode Issues
**Problem:** Error details exposed in production

**Solution:**
```python
# In settings.py
DEBUG = False  # CRITICAL FOR PRODUCTION

# Set valid ALLOWED_HOSTS
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']

# Set SECRET_KEY to random strong value
SECRET_KEY = 'long-random-string-50+-characters'
```

#### 4. Database Backup Issues
**Problem:** Backups failing or not running

**Solution:**
```bash
# Backup PostgreSQL
pg_dump talentpulse_db > backup.sql

# Backup SQLite
cp db.sqlite3 db.sqlite3.backup

# Verify backup
pg_restore -U postgres -d talentpulse_db backup.sql
```

---

### Debugging Techniques

#### 1. Django Shell
```bash
# Access Django shell
python manage.py shell

# Test models
>>> from accounts.models import User
>>> users = User.objects.all()
>>> print(users.query)  # See SQL

# Test serializers
>>> from accounts.serializers import UserSerializer
>>> user = User.objects.first()
>>> serializer = UserSerializer(user)
>>> print(serializer.data)

# Test permissions
>>> from core.permissions import IsHRAdmin
>>> permission = IsHRAdmin()
>>> permission.has_permission(request, view)
```

#### 2. Logging
```python
# In views.py
import logging
logger = logging.getLogger(__name__)

def my_view(request):
    logger.debug(f'Request data: {request.data}')
    logger.error(f'Error occurred: {str(e)}')
```

#### 3. Print Statements (Development Only)
```python
# In views.py
print(f"DEBUG: {variable_name}")
print(f"Request user: {request.user}")
print(f"Request data: {request.data}")
```

#### 4. Check Status
```bash
# Check services
sudo systemctl status postgres
sudo systemctl status nginx
sudo systemctl status gunicorn

# Check logs
tail -f /var/log/talentpulse/error.log
tail -f /var/log/talentpulse/access.log

# Monitor system
top
free -h
df -h
```

---

### Getting Help

#### 1. Check Documentation
- Read `README.md` for overview
- Check `API_DOCUMENTATION.md` for endpoint specs
- Review `SETUP_GUIDE.md` for configuration

#### 2. Enable Verbose Logging
```bash
# Run server with verbose output
python manage.py runserver --verbosity=2

# Run tests with verbose output
python manage.py test --verbosity=2
```

#### 3. Check Django Documentation
- Django: https://docs.djangoproject.com/
- DRF: https://www.django-rest-framework.org/
- JWT: https://django-rest-framework-simplejwt.readthedocs.io/

#### 4. Test with API Client
```bash
# Use curl
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/employees/

# Use HTTPie (more readable)
http --auth-type bearer --auth TOKEN http://localhost:8000/api/employees/

# Use Postman (use POSTMAN_COLLECTION.json)
```

---

### Quick Reference

| Issue | Command |
|-------|---------|
| Activate venv | `source venv-v2/bin/activate` |
| Install deps | `pip install -r requirements.txt` |
| Run migrations | `python manage.py migrate` |
| Create superuser | `python manage.py createsuperuser` |
| Seed data | `python manage.py seed_initial_data` |
| Start server | `python manage.py runserver` |
| Django shell | `python manage.py shell` |
| Run tests | `python manage.py test` |
| Check system | `python manage.py check` |
| Collect static | `python manage.py collectstatic --noinput` |

---

**Note:** For issues not listed here, check the Django and DRF documentation, or consult the project README and SETUP_GUIDE files.

Last Updated: 2024

import uuid
import os
from django.conf import settings
from datetime import datetime, timedelta


def generate_uuid():
    """Generate UUID for records"""
    return uuid.uuid4()


def upload_profile_image_path(instance, filename):
    """Generate upload path for profile images"""
    return f'profiles/{instance.id}/{filename}'


def upload_resume_path(instance, filename):
    """Generate upload path for resumes"""
    return f'resumes/{instance.id}/{filename}'


def upload_offer_letter_path(instance, filename):
    """Generate upload path for offer letters"""
    return f'offer_letters/{instance.id}/{filename}'


def upload_payslip_path(instance, filename):
    """Generate upload path for payslips"""
    return f'payslips/{instance.id}/{filename}'


def calculate_age(birth_date):
    """Calculate age from birth date"""
    today = datetime.now().date()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


def get_financial_year():
    """Get current financial year (April - March)"""
    today = datetime.now().date()
    if today.month >= 4:
        return f"{today.year}-{today.year + 1}"
    else:
        return f"{today.year - 1}-{today.year}"


def get_financial_year_start():
    """Get financial year start date"""
    today = datetime.now().date()
    if today.month >= 4:
        return datetime(today.year, 4, 1).date()
    else:
        return datetime(today.year - 1, 4, 1).date()


def get_financial_year_end():
    """Get financial year end date"""
    today = datetime.now().date()
    if today.month >= 4:
        return datetime(today.year + 1, 3, 31).date()
    else:
        return datetime(today.year, 3, 31).date()


def validate_file_size(file, max_size_mb=5):
    """Validate file size"""
    max_size = max_size_mb * 1024 * 1024
    if file.size > max_size:
        raise ValueError(f"File size must not exceed {max_size_mb}MB")
    return True


def validate_file_extension(file, allowed_extensions):
    """Validate file extension"""
    ext = file.name.split('.')[-1].lower()
    if ext not in allowed_extensions:
        raise ValueError(f"Only {', '.join(allowed_extensions)} files are allowed")
    return True


def generate_employee_id():
    """Generate unique sequential employee ID in YYYY + 6-digit sequence format (exactly 10 digits)"""
    from django.contrib.auth import get_user_model
    import datetime

    current_year = datetime.datetime.now().year
    prefix = str(current_year)

    try:
        User = get_user_model()
        # Find all 10-digit sequential numeric IDs for the current year
        users = User.objects.filter(employee_id__regex=rf'^{prefix}\d{{6}}$').order_by('-employee_id')
        latest_user = users.first()

        if latest_user:
            try:
                seq = int(latest_user.employee_id[4:]) + 1
            except ValueError:
                seq = 1
        else:
            seq = 1
    except Exception:
        # Fallback if DB table is not created yet during initial migrations
        seq = 1

    return f"{prefix}{seq:06d}"


class AuditMixin:
    """Mixin for audit trail fields"""
    created_at = None
    updated_at = None
    created_by = None
    updated_by = None
    
    def set_audit_fields(self, user):
        """Set audit fields when creating/updating"""
        if not self.id:
            self.created_by = user
        self.updated_by = user
        self.updated_at = datetime.now()

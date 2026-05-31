from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from accounts.models import User
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def log_user_creation(sender, instance, created, **kwargs):
    """Log when a user is created"""
    if created:
        logger.info(f"New user created: {instance.email} ({instance.employee_id})")


@receiver(post_save, sender=User)
def log_user_update(sender, instance, created, **kwargs):
    """Log when a user is updated"""
    if not created:
        logger.info(f"User updated: {instance.email}")


@receiver(post_save, sender=User)
def create_employee_profile(sender, instance, created, **kwargs):
    """Create employee profile and auto-map department/designation for new users"""
    if created:
        from employees.models import EmployeeProfile, Department, Designation
        from django.utils import timezone
        
        # Determine defaults based on role, but honor user's custom department if set
        role = instance.role.lower()
        dept_name = instance.department
        desig_name = instance.designation
        
        # Get matching DB Department & Designation models, or get/create them if missing
        dept_obj = None
        desig_obj = None
        
        if dept_name:
            dept_obj = Department.objects.filter(name=dept_name).first()
            if not dept_obj:
                dept_obj = Department.objects.create(name=dept_name, description=f"{dept_name} department")
                
            if desig_name:
                desig_obj = Designation.objects.filter(name=desig_name, department=dept_obj).first()
                if not desig_obj:
                    desig_obj = Designation.objects.create(name=desig_name, department=dept_obj)
        
        # Auto-update User model text fields and joining date
        if not instance.joining_date:
            instance.joining_date = timezone.now().date()
            
        # Temporarily disconnect the signal to avoid infinite recursion on save()
        post_save.disconnect(create_employee_profile, sender=User)
        instance.save()
        post_save.connect(create_employee_profile, sender=User)
        
        # Create EmployeeProfile
        profile, _ = EmployeeProfile.objects.get_or_create(
            user=instance,
            defaults={
                'department': dept_obj,
                'designation': desig_obj,
                'office_location': 'Remote' if dept_name else None,
                'contact_number': instance.phone or '',
                'personal_email': instance.email
            }
        )
        
        # If profile existed but was empty and dept_name is set, update it
        if dept_obj and (not profile.department or not profile.designation):
            profile.department = dept_obj
            if desig_obj:
                profile.designation = desig_obj
            profile.save()

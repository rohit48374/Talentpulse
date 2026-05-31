from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from accounts.models import AuditLog

User = get_user_model()


class UserRegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    
    username = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    employee_id = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    role = serializers.CharField(required=False, default='employee')
    
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'employee_id', 'full_name', 'first_name', 'last_name', 'phone', 'department', 'role', 'password', 'password_confirm']
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password': 'Passwords do not match'})
            
        email = data.get('email')
        if email:
            if User.objects.filter(email=email).exists():
                raise serializers.ValidationError({'email': 'A user with this email address already exists.'})
                
            if not data.get('username'):
                base_username = email.split('@')[0]
                username = base_username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                data['username'] = username
                
        employee_id = data.get('employee_id')
        if employee_id:
            if User.objects.filter(employee_id=employee_id).exists():
                raise serializers.ValidationError({'employee_id': 'A user with this Employee ID already exists.'})
            
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        # Force all public registrations to strictly have the 'employee' role
        validated_data['role'] = 'employee'
        
        # Calculate full_name
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')
        validated_data['full_name'] = f"{first_name} {last_name}".strip()
        
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user data"""
    reporting_manager = serializers.SerializerMethodField()
    office_location = serializers.SerializerMethodField()
    gender = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    designation = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name', 'employee_id',
            'phone', 'role', 'department', 'designation', 'profile_image',
            'address', 'salary', 'joining_date', 'status', 'is_active',
            'reporting_manager', 'office_location', 'gender',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'employee_id', 'created_at', 'updated_at']

    def get_reporting_manager(self, obj):
        try:
            profile = obj.employee_profile
            return profile.reporting_manager.id if profile.reporting_manager else None
        except Exception:
            return None

    def get_office_location(self, obj):
        try:
            profile = obj.employee_profile
            return profile.office_location
        except Exception:
            return None

    def get_gender(self, obj):
        try:
            return obj.employee_profile.gender
        except Exception:
            return None

    def get_department(self, obj):
        try:
            profile = obj.employee_profile
            if profile.department:
                return profile.department.name
        except Exception:
            pass
        return obj.department

    def get_designation(self, obj):
        try:
            profile = obj.employee_profile
            if profile.designation:
                return profile.designation.name
        except Exception:
            pass
        return obj.designation

    def get_status(self, obj):
        try:
            profile = obj.employee_profile
            if profile.status:
                return profile.status
        except Exception:
            pass
        return obj.status


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for user profile"""
    department = serializers.SerializerMethodField()
    designation = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name', 'employee_id', 'phone',
            'role', 'department', 'designation', 'profile_image', 'address',
            'salary', 'joining_date', 'status', 'is_active', 'created_at',
            'updated_at'
        ]

    def get_department(self, obj):
        try:
            profile = obj.employee_profile
            if profile.department:
                return profile.department.name
        except Exception:
            pass
        return obj.department

    def get_designation(self, obj):
        try:
            profile = obj.employee_profile
            if profile.designation:
                return profile.designation.name
        except Exception:
            pass
        return obj.designation

    def get_status(self, obj):
        try:
            profile = obj.employee_profile
            if profile.status:
                return profile.status
        except Exception:
            pass
        return obj.status


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""
    
    class Meta:
        model = User
        fields = [
            'full_name', 'phone', 'profile_image', 'address'
        ]


class UserPasswordChangeSerializer(serializers.Serializer):
    """Serializer for changing password"""
    
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({'new_password': 'Passwords do not match'})
        return data


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for audit logs"""
    
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'user_email', 'action', 'model_name', 'object_id', 
                  'changes', 'ip_address', 'timestamp']
        read_only_fields = ['id', 'timestamp']

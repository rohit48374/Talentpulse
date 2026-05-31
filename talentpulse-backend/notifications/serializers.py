# NOTIFICATIONS SERIALIZERS
from rest_framework import serializers
from notifications.models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    recipient_name = serializers.CharField(source='recipient.full_name', read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'recipient_name', 'notification_type', 'title',
                  'message', 'related_object_type', 'related_object_id', 'status',
                  'action_url', 'created_at', 'read_at']
        read_only_fields = ['created_at', 'read_at']


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = NotificationPreference
        fields = ['id', 'user', 'user_name', 'leave_notifications',
                  'payroll_notifications', 'recruitment_notifications',
                  'appraisal_notifications', 'attendance_notifications',
                  'email_notifications', 'push_notifications',
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

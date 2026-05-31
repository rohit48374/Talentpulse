# DASHBOARD SERIALIZERS
from rest_framework import serializers
from dashboard.models import DashboardCard


class DashboardCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardCard
        fields = ['id', 'title', 'card_type', 'applicable_role', 'description',
                  'icon', 'position', 'is_active']

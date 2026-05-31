from django.contrib import admin
from dashboard.models import DashboardCard


@admin.register(DashboardCard)
class DashboardCardAdmin(admin.ModelAdmin):
    list_display = ['title', 'card_type', 'applicable_role', 'position', 'is_active']
    list_filter = ['card_type', 'applicable_role', 'is_active']
    search_fields = ['title']
    ordering = ['applicable_role', 'position']

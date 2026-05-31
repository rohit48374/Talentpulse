from django.urls import path, include
from rest_framework.routers import DefaultRouter
from accounts.views import UserViewSet, AuditLogViewSet, CurrentUserView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('users/me/', CurrentUserView.as_view(), name='current-user-me'),
    path('', include(router.urls)),
]

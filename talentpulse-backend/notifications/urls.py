from django.urls import path, include
from rest_framework.routers import DefaultRouter
from notifications.views import NotificationViewSet, NotificationPreferenceViewSet

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = [
    path('preferences/list/', NotificationPreferenceViewSet.as_view({'get': 'list'}), name='notification-preference-list'),
    path('preferences/update/', NotificationPreferenceViewSet.as_view({'put': 'update'}), name='notification-preference-update'),
    path('', include(router.urls)),
]

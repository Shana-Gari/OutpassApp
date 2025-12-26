from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OutpassViewSet, StaffDashboardViewSet

router = DefaultRouter()
router.register(r'outpasses', OutpassViewSet, basename='outpass')
router.register(r'staff/dashboard', StaffDashboardViewSet, basename='staff-dashboard')

urlpatterns = [
    path('', include(router.urls)),
]

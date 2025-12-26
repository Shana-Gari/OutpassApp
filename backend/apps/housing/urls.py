from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HostelViewSet, RoomViewSet

router = DefaultRouter()
router.register(r'hostels', HostelViewSet)
router.register(r'rooms', RoomViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

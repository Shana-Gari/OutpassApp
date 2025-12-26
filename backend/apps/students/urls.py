from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, LinkStudentView, GuardianViewSet

router = DefaultRouter()
router.register(r'students', StudentViewSet, basename='student')
router.register(r'guardians', GuardianViewSet, basename='guardian')

urlpatterns = [
    path('', include(router.urls)),
    path('link-student/', LinkStudentView.as_view(), name='link-student'),
]

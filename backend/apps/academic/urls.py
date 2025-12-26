from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AcademicYearViewSet, ClassViewSet, SectionViewSet

router = DefaultRouter()
router.register(r'academic-years', AcademicYearViewSet)
router.register(r'classes', ClassViewSet)
router.register(r'sections', SectionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

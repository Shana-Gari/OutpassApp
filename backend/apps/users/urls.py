from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SendOtpView, VerifyOtpView, UserViewSet, AdminLoginView, 
    PasswordLoginView, ChangePasswordView, ForgotPasswordView, ResetPasswordView,
    ExportDataView
)

router = DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', PasswordLoginView.as_view(), name='login'),
    path('auth/send-otp/', SendOtpView.as_view(), name='send-otp'),
    path('auth/verify-otp/', VerifyOtpView.as_view(), name='verify-otp'),
    path('auth/admin-login/', AdminLoginView.as_view(), name='admin-login'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('export/', ExportDataView.as_view(), name='export-data'),
]

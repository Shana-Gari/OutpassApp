import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from .managers import UserManager as CustomUserManager

class User(AbstractUser):
    class Roles(models.TextChoices):
        PARENT = 'PARENT', 'Parent'
        ACCOUNTANT = 'ACCOUNTANT', 'Accountant'
        WARDEN = 'WARDEN', 'Warden'
        HM = 'HM', 'HM/Principal'
        GATE_STAFF = 'GATE_STAFF', 'Gate Staff'
        ADMIN = 'ADMIN', 'Admin'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=15, unique=True, db_index=True)
    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.PARENT)
    
    # Optional fields
    address = models.TextField(blank=True, null=True)
    alt_phone = models.CharField(max_length=15, blank=True, null=True)
    staff_id = models.CharField(max_length=50, blank=True, null=True, unique=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    
    is_verified = models.BooleanField(default=False)
    
    # Use phone as username
    username = None
    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    class Meta:
        indexes = [
            models.Index(fields=['phone', 'role']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.phone} ({self.role})"


class ParentProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='parent_profile')
    occupation = models.CharField(max_length=100, blank=True)
    emergency_contact = models.CharField(max_length=15, blank=True)
    aadhar_number = models.CharField(max_length=12, blank=True)
    pan_number = models.CharField(max_length=10, blank=True)

    def __str__(self):
        return f"Parent Profile: {self.user.phone}"


class StaffProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    designation = models.CharField(max_length=100)
    joining_date = models.DateField(auto_now_add=True)  # Or input manually? User said "DATE NOT NULL"
    # assigned_hostel will be ForeignKey to Hostel model (circular dependency handling needed or define in Housing)
    # User schema puts assigned_hostel in StaffProfiles. 
    # To avoid circular imports, usually define ForeignKey as string 'housing.Hostel'
    assigned_hostel = models.ForeignKey('housing.Hostel', on_delete=models.SET_NULL, null=True, blank=True, related_name='staff')
    gate_number = models.CharField(max_length=50, blank=True)
    shift_timing = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.designation}: {self.user.phone}"


class OtpVerification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=15)
    otp = models.CharField(max_length=6)
    purpose = models.CharField(max_length=50)
    expires_at = models.DateTimeField()
    verified = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['phone', 'purpose']),
            models.Index(fields=['expires_at']),
        ]

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import ParentProfile, StaffProfile

User = get_user_model()

class LoginSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    role = serializers.CharField(max_length=20, required=False)

class OtpVerifySerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    otp = serializers.CharField(max_length=6)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

class PasswordResetSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=6)

class ParentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParentProfile
        fields = ['occupation', 'emergency_contact', 'aadhar_number', 'pan_number']

class StaffProfileSerializer(serializers.ModelSerializer):
    assigned_hostel_id = serializers.CharField(source='assigned_hostel.id', read_only=True)
    
    class Meta:
        model = StaffProfile
        fields = ['designation', 'assigned_hostel_id', 'gate_number', 'shift_timing']

class UserSerializer(serializers.ModelSerializer):
    parent_profile = ParentProfileSerializer(required=False, allow_null=True)
    staff_profile = StaffProfileSerializer(read_only=True)  # Staff details often read-only here or handled separately
    assigned_hostel = serializers.CharField(write_only=True, required=False, allow_null=True)
    # assigned_hostel_name = serializers.CharField(source='staff_profile.assigned_hostel.name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'phone', 'role', 'first_name', 'last_name', 'email', 
            'is_active', 'is_verified', 'parent_profile', 'staff_profile',
            'assigned_hostel', 'staff_id', 'department'
        ]
        read_only_fields = ['id', 'is_verified']

    def create(self, validated_data):
        parent_data = validated_data.pop('parent_profile', None)
        assigned_hostel_id = validated_data.pop('assigned_hostel', None)
        
        # Standard user creation
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
        else:
            # Default password for now if not provided (should be handled by frontend/logic)
            user.set_password(user.phone) 
        user.save()

        # Handle specific roles
        if user.role == 'PARENT' and parent_data:
            ParentProfile.objects.update_or_create(user=user, defaults=parent_data)
        elif user.role == 'PARENT':
             # Create empty profile if needed
            ParentProfile.objects.get_or_create(user=user)

        if user.role in ['WARDEN', 'HM', 'ACCOUNTANT', 'GATE_STAFF']:
            # Handle Staff Profile creation
            from apps.housing.models import Hostel  # Local import to avoid circular dependency
            
            hostel = None
            if assigned_hostel_id:
                hostel = Hostel.objects.filter(id=assigned_hostel_id).first()
            
            StaffProfile.objects.update_or_create(
                user=user,
                defaults={
                    'designation': user.role, # Default designation
                    'assigned_hostel': hostel
                }
            )

        return user

    def update(self, instance, validated_data):
        parent_data = validated_data.pop('parent_profile', None)
        assigned_hostel_id = validated_data.pop('assigned_hostel', None)

        # Update User fields
        for attr, value in validated_data.items():
            if attr == 'password':
                instance.set_password(value)
            else:
                setattr(instance, attr, value)
        instance.save()

        # Update Parent Profile
        if instance.role == 'PARENT' and parent_data:
            ParentProfile.objects.update_or_create(user=instance, defaults=parent_data)

        # Update Staff Profile (Hostel assignment)
        if instance.role in ['WARDEN', 'HM', 'ACCOUNTANT', 'GATE_STAFF']:
             from apps.housing.models import Hostel # Local import
             
             staff_profile, _ = StaffProfile.objects.get_or_create(user=instance)
             if assigned_hostel_id:
                 hostel = Hostel.objects.filter(id=assigned_hostel_id).first()
                 staff_profile.assigned_hostel = hostel
                 staff_profile.save()
             elif assigned_hostel_id is None and 'assigned_hostel' in self.initial_data:
                 # Explicit clear if passed as null
                 staff_profile.assigned_hostel = None
                 staff_profile.save()

        return instance


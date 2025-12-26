from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import StaffProfile, ParentProfile

User = get_user_model()

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        if instance.role == 'PARENT':
            ParentProfile.objects.create(user=instance)
        elif instance.role in ['WARDEN', 'HM', 'ACCOUNTANT', 'GATE_STAFF']:
            StaffProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if instance.role == 'PARENT':
        if hasattr(instance, 'parent_profile'):
            instance.parent_profile.save()
    elif instance.role in ['WARDEN', 'HM', 'ACCOUNTANT', 'GATE_STAFF']:
        if hasattr(instance, 'staff_profile'):
            instance.staff_profile.save()

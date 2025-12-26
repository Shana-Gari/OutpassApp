import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth import get_user_model, authenticate
User = get_user_model()

phone = '9000000001'
password = 'IES_SDA'

print(f"Checking user: {phone}")
user = User.objects.filter(phone='9000000001').first()

if user:
    print(f"✅ User found: {user.first_name} {user.last_name} (Role: {user.role})")
    print(f"Checking user: {user.phone}")
    print(f"Role: {user.role}")

    # Check if the original password works
    if user.check_password(password):
        print("✅ Original password check PASSED")
    else:
        print("❌ Original password check FAILED")
        # Try to set it again to be sure
        print("Resetting password to match expectations...")
        user.set_password(password)
        user.save()
        print("✅ Password RESET to 'IES_SDA'")

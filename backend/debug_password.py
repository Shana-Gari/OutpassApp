import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

target_phone = '9999999999'
user = User.objects.filter(phone=target_phone).first()

if user:
    print(f"User: {user.phone}")
    print(f"Role: {user.role}")
    print(f"Stored Password: '{user.password}'")
    print(f"Is Password 'IES_SDA'?: {user.password == 'IES_SDA'}")
    
    # Check check_password method
    print(f"check_password('IES_SDA'): {user.check_password('IES_SDA')}")
else:
    print(f"User {target_phone} not found.")

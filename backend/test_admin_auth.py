import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from django.contrib.auth import authenticate
from apps.users.models import User

phone = '9999999999'
# Try with phone number as password (which is the enforced rule)
user = authenticate(username=phone, password=phone)

if user:
    print("Authenticate with Phone as Password: SUCCESS")
else:
    print("Authenticate with Phone as Password: FAILED")

# Try with 'admin' (what create_admin set)
user_admin = authenticate(username=phone, password='admin')
if user_admin:
    print("Authenticate with 'admin': SUCCESS")
else:
    print("Authenticate with 'admin': FAILED")

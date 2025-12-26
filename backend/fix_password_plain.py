import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

# List of phones to fix
phones = ['9000000001', '9876543210', '9876543211', '9999999999', '8888888888']

print("Fixing passwords to plain text 'IES_SDA'...")

for phone in phones:
    user = User.objects.filter(phone=phone).first()
    if user:
        # Direct assignment to bypass any potential set_password weirdness if needed, 
        # though set_password override should work.
        # But to be 100% sure:
        user.password = 'IES_SDA'
        user.save()
        print(f"✅ Fixed {user.phone} ({user.role})")
    else:
        print(f"❌ User {phone} not found")

# Verify
print("\nVerifying...")
u = User.objects.get(phone='9999999999')
print(f"User 9999999999 Password: {u.password}")
print(f"Check 'IES_SDA': {u.check_password('IES_SDA')}")

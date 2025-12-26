import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from apps.users.models import User

def create_admin():
    if not User.objects.filter(phone='9999999999').exists():
        admin = User.objects.create_superuser(
            phone='9999999999',
            password='admin',
            role='ADMIN'
        )
        print("Superuser created successfully.")
        print("Phone (Username): 9999999999")
        print("Password: 9999999999 (Same as Phone)")
    else:
        print("Admin user already exists.")

if __name__ == '__main__':
    create_admin()

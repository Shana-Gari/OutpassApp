import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from apps.users.models import User

def list_users():
    users = User.objects.all()
    print(f"{'Role':<15} {'Name':<20} {'Phone':<15}")
    print("-" * 50)
    for user in users:
        print(f"{user.role:<15} {user.first_name} {user.last_name:<20} {user.phone:<15}")

if __name__ == '__main__':
    list_users()

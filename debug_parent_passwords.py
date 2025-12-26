import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.abspath('backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

def check_parent_passwords():
    print("\n--- Checking PARENT Credentials ---")
    parents = User.objects.filter(role='PARENT')
    
    if not parents.exists():
        print("No parents found in database.")
        return

    print(f"{'Name':<20} | {'Phone':<12} | {'Email':<25} | {'Password Status'}")
    print("-" * 80)

    for p in parents:
        status = "UNKNOWN"
        
        # Check against Email
        if p.email and p.check_password(p.email):
            status = "Matches Email"
        # Check against Phone
        elif p.check_password(p.phone):
            status = "Matches Phone"
        # Check specific hardcoded (common in dev)
        elif p.check_password("123456"):
            status = "Matches '123456'"
        elif p.check_password("password"):
            status = "Matches 'password'"
        else:
            status = "INVALID / CHANGED"

        print(f"{p.first_name + ' ' + p.last_name:<20} | {p.phone:<12} | {p.email:<25} | {status}")

if __name__ == "__main__":
    check_parent_passwords()

import os
import django
import sys
from datetime import date, timedelta

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from apps.users.models import User
from apps.students.models import Student
from apps.outpasses.models import Outpass
from apps.housing.models import Hostel

def debug_warden_visibility():
    print("--- Debugging Warden Visibility ---")

    # 1. Find a Warden
    wardens = User.objects.filter(role=User.Roles.WARDEN)
    if not wardens.exists():
        print("ERROR: No Warden users found.")
        return

    warden = wardens.first()
    print(f"Warden: {warden.first_name} ({warden.phone})")
    
    if hasattr(warden, 'staff_profile'):
        print(f"  Assigned Hostel: {warden.staff_profile.assigned_hostel}")
        warden_hostel = warden.staff_profile.assigned_hostel
    else:
        print("  ERROR: Warden has no staff_profile.")
        return

    # 2. Find Approved Outpasses
    approved_outpasses = Outpass.objects.filter(status=Outpass.Status.APPROVED)
    print(f"\nTotal Approved Outpasses: {approved_outpasses.count()}")

    for op in approved_outpasses:
        print(f"\nOutpass {op.id}:")
        print(f"  Student: {op.student.first_name} ({op.student.hostel})")
        print(f"  Outgoing Date: {op.outgoing_date}")
        print(f"  Today is: {date.today()}")
        
        # 3. Check Visibility Logic
        is_same_hostel = (op.student.hostel == warden_hostel)
        is_today = (op.outgoing_date == date.today())
        
        print(f"  Match Hostel? {is_same_hostel}")
        print(f"  Match Date=Today? {is_today}")

        if is_same_hostel:
            if is_today:
                print("  -> Should be VISIBLE in Default View")
            else:
                print("  -> HIDDEN in Default View (Date Mismatch)")
        else:
            print("  -> HIDDEN (Hostel Mismatch)")

if __name__ == '__main__':
    debug_warden_visibility()

import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from apps.outpasses.models import Outpass

def approve_request():
    # Find Pending Request
    req = Outpass.objects.filter(status='PENDING').last()
    if req:
        print(f"Found Request: {req.id} for {req.student.first_name}")
        print(f"Current Status: {req.status}")
        
        req.status = 'APPROVED'
        # req.approved_by = None 
        req.save()
        print("Status updated to APPROVED manually.")
    else:
        print("No PENDING requests found.")

if __name__ == '__main__':
    approve_request()

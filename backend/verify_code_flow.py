import os
import django
import sys
import uuid
from django.utils import timezone

sys.path.append('c:\\Users\\Shana\\Desktop\\OutpassApp\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from apps.outpasses.models import Outpass, Approval
from apps.users.models import User
from apps.students.models import Student
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.outpasses.views import StaffDashboardViewSet, OutpassViewSet

def verify_code_flow():
    print("--- Starting Verify Code Flow ---")
    
    # 1. Setup Data
    student = Student.objects.first()
    if not student:
        print("No student found. Creating one...")
        # Create dummy if needed
        return

    warden = User.objects.filter(role='WARDEN').first()
    gate = User.objects.filter(role='GATE_STAFF').first()
    
    # Create an APPROVED outpass
    outpass = Outpass.objects.create(
        student=student,
        parent=student.parent_relationships.first().parent if student.parent_relationships.exists() else User.objects.filter(role='PARENT').first(),
        reason="Test Code Flow",
        outgoing_date=timezone.now().date(),
        outgoing_time=timezone.now().time(),
        expected_return_date=timezone.now().date(),
        expected_return_time=timezone.now().time(),
        status=Outpass.Status.APPROVED
    )
    print(f"Created Outpass {outpass.id} (APPROVED)")

    factory = APIRequestFactory()

    # 2. Warden Vacate (Generate Exit Code)
    print("\n[Step 1] Warden Vacate (Generate Exit Code)")
    view_vacate = StaffDashboardViewSet.as_view({'post': 'warden_vacate'})
    req_vacate = factory.post(f'/api/staff/dashboard/{outpass.id}/warden_vacate/')
    force_authenticate(req_vacate, user=warden)
    res_vacate = view_vacate(req_vacate, pk=outpass.id)
    print(f"Status: {res_vacate.status_code}")
    print(f"Data: {res_vacate.data}")
    
    exit_code = res_vacate.data.get('exit_code')
    if not exit_code:
        print("Failed to get exit code")
        return

    # 3. Gate Exit (Verify Exit Code)
    print(f"\n[Step 2] Gate Verification (Exit Code: {exit_code})")
    view_gate = StaffDashboardViewSet.as_view({'post': 'gate_process_code'}) # Note: ensure view name is correct
    req_exit = factory.post('/api/staff/dashboard/gate/process-code/', {'code': exit_code})
    force_authenticate(req_exit, user=gate)
    res_exit = view_gate(req_exit)
    print(f"Status: {res_exit.status_code}")
    print(f"Data: {res_exit.data}")
    
    return_code = res_exit.data.get('return_code')
    if not return_code:
        print("Failed to get return code")
        return

    # 4. Gate Return (Verify Return Code)
    print(f"\n[Step 3] Gate Verification (Return Code: {return_code})")
    req_return = factory.post('/api/staff/dashboard/gate/process-code/', {'code': return_code})
    force_authenticate(req_return, user=gate)
    res_return = view_gate(req_return)
    print(f"Status: {res_return.status_code}")
    print(f"Data: {res_return.data}")

    # Cleanup
    outpass.delete()
    print("\n--- Verification Complete ---")

if __name__ == '__main__':
    verify_code_flow()

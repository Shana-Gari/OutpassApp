import os
import django
import sys
import random
from django.utils import timezone

sys.path.append('c:\\Users\\Shana\\Desktop\\OutpassApp\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from apps.outpasses.models import Outpass, Approval
from apps.users.models import User
from apps.students.models import Student
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.outpasses.views import StaffDashboardViewSet, OutpassViewSet

factory = APIRequestFactory()
staff_view = StaffDashboardViewSet.as_view({
    'post': 'create', 
    'get': 'list'
}) # Note: create is likely on OutpassViewSet for parents

parent_view = OutpassViewSet.as_view({'post': 'create'})
hm_approve_view = StaffDashboardViewSet.as_view({'post': 'hm_approve'})
warden_vacate_view = StaffDashboardViewSet.as_view({'post': 'warden_vacate'})
gate_process_view = StaffDashboardViewSet.as_view({'post': 'gate_process_code'})

def get_user(role):
    return User.objects.filter(role=role).first()

def run_simulation():
    print("ALL DATA WILL BE DELETED... Deleting Outpasses & Approvals...")
    Approval.objects.all().delete()
    Outpass.objects.all().delete()
    print("Data Wiped. Starting Simulation.\n")

    # 1. Actors
    student = Student.objects.first()
    parent = get_user(User.Roles.PARENT) # Or student.parents...
    hm = get_user(User.Roles.HM)
    warden = get_user(User.Roles.WARDEN)
    gate = get_user(User.Roles.GATE_STAFF)

    if not all([student, parent, hm, warden, gate]):
        print("Missing users! Check DB.")
        return

    print(f"Actors: Student={student.first_name}, Parent={parent.first_name}")

    # 2. Parent Request (Phone Sim)
    print("\n[Step 1] Parent: Requesting Outpass...")
    data = {
        'student': student.id,
        'reason': 'Simulation Outpass',
        'outgoing_date': timezone.now().date(),
        'outgoing_time': timezone.now().time(),
        'expected_return_date': timezone.now().date(),
        'expected_return_time': (timezone.now() + timezone.timedelta(hours=4)).time(),
    }
    req = factory.post('/api/outpasses/', data)
    force_authenticate(req, user=parent)
    res = parent_view(req)
    if res.status_code != 201:
        print(f"Failed to create outpass: {res.data}")
        return
    
    outpass_id = res.data['id']
    print(f"✅ Outpass Created: {outpass_id}")

    # 3. HM Approve (Admin/Phone Sim)
    print("\n[Step 2] HM: Approving...")
    req = factory.post(f'/api/staff/dashboard/{outpass_id}/hm/approve/')
    force_authenticate(req, user=hm)
    res = hm_approve_view(req, pk=outpass_id)
    print(f"Status: {res.status_code} - {res.data}")

    # 4. Warden Vacate (Phone Sim)
    print("\n[Step 3] Warden: Granting Exit (Generating Code)...")
    req = factory.post(f'/api/staff/dashboard/{outpass_id}/warden_vacate/')
    force_authenticate(req, user=warden)
    res = warden_vacate_view(req, pk=outpass_id)
    
    exit_code = res.data.get('exit_code')
    print(f"✅ Exit Code Generated: {exit_code}")

    if not exit_code:
        print("Stopping: No exit code.")
        return

    # 5. Gate Exit (Phone Sim - Verify Code Screen)
    print(f"\n[Step 4] Gate: Verifying Exit Code {exit_code}...")
    req = factory.post('/api/staff/dashboard/gate/process-code/', {'code': exit_code})
    force_authenticate(req, user=gate)
    res = gate_process_view(req)
    
    return_code = res.data.get('return_code')
    print(f"✅ processed: {res.data.get('status')} | Return Code: {return_code}")
    
    if not return_code:
        print("Stopping: No return code.")
        return

    # 6. Gate Return (Phone Sim - Verify Code Screen)
    print(f"\n[Step 5] Gate: Verifying Return Code {return_code}...")
    req = factory.post('/api/staff/dashboard/gate/process-code/', {'code': return_code})
    force_authenticate(req, user=gate)
    res = gate_process_view(req)
    print(f"✅ processed: {res.data.get('status')}")

    print("\n--- Simulation Complete ---")

if __name__ == '__main__':
    run_simulation()

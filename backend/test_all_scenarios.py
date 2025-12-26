import os
import django
import sys
import uuid
import random
from django.utils import timezone

sys.path.append('c:\\Users\\Shana\\Desktop\\OutpassApp\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from apps.outpasses.models import Outpass
from apps.users.models import User
from apps.students.models import Student
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.outpasses.views import StaffDashboardViewSet

factory = APIRequestFactory()
gate_view = StaffDashboardViewSet.as_view({'post': 'gate_process_code'})
warden_view = StaffDashboardViewSet.as_view({'post': 'warden_vacate'})

def get_or_create_user(role):
    user = User.objects.filter(role=role).first()
    if not user:
        user = User.objects.create(phone=f'999{random.randint(1000,9999)}', role=role)
        user.set_password('pass')
        user.save()
    return user

def create_outpass(student, status=Outpass.Status.APPROVED):
    return Outpass.objects.create(
        student=student,
        parent=student.parent_relationships.first().parent if student.parent_relationships.exists() else User.objects.filter(role='PARENT').first(),
        reason="Test Scenario",
        outgoing_date=timezone.now().date(),
        outgoing_time=timezone.now().time(),
        expected_return_date=timezone.now().date(),
        expected_return_time=timezone.now().time(),
        status=status
    )

def run_test(name, assertion):
    try:
        if assertion():
            print(f"✅ PASS: {name}")
        else:
            print(f"❌ FAIL: {name}")
    except Exception as e:
        print(f"❌ ERROR: {name} - {str(e)}")

def test_scenarios():
    print("--- Starting Comprehensive Scenario Tests ---")
    
    student = Student.objects.first()
    if not student:
        print("No student found. Aborting.")
        return

    warden = get_or_create_user(User.Roles.WARDEN)
    gate = get_or_create_user(User.Roles.GATE_STAFF)

    # Scenario 1: Happy Path
    print("\n--- Scenario 1: Happy Path ---")
    op1 = create_outpass(student, Outpass.Status.APPROVED)
    
    # 1.1 Warden Vacate
    req = factory.post(f'/api/staff/dashboard/{op1.id}/warden_vacate/')
    force_authenticate(req, user=warden)
    res = warden_view(req, pk=op1.id)
    exit_code = res.data.get('exit_code')
    run_test("Warden Vacate generates Exit Code", lambda: res.status_code == 200 and exit_code)

    # 1.2 Gate Exit
    req = factory.post('/api/staff/dashboard/gate/process-code/', {'code': exit_code})
    force_authenticate(req, user=gate)
    res = gate_view(req)
    return_code = res.data.get('return_code')
    run_test("Gate Exit accepts Exit Code & Returns Return Code", lambda: res.status_code == 200 and return_code)

    # 1.3 Gate Return
    req = factory.post('/api/staff/dashboard/gate/process-code/', {'code': return_code})
    force_authenticate(req, user=gate)
    res = gate_view(req)
    run_test("Gate Return accepts Return Code", lambda: res.status_code == 200 and res.data['type'] == 'ENTRY')

    # Scenario 2: Invalid/Random Code
    print("\n--- Scenario 2: Invalid Code ---")
    req = factory.post('/api/staff/dashboard/gate/process-code/', {'code': '999999'}) # Random likely unused
    force_authenticate(req, user=gate)
    res = gate_view(req)
    run_test("Invalid Code returns 404", lambda: res.status_code == 404)

    # Scenario 3: Reuse Exit Code (Double Exit)
    print("\n--- Scenario 3: Reuse Exit Code ---")
    # op1 is already returned/completed (and definitely checked out). 
    # Let's try to use the SAME exit_code again.
    # Note: Backend logic finds Outpass by (exit_code=code, status=READY_FOR_EXIT).
    # Since op1 status is COMPLETED, it should NOT find it.
    req = factory.post('/api/staff/dashboard/gate/process-code/', {'code': exit_code})
    force_authenticate(req, user=gate)
    res = gate_view(req)
    run_test("Reusing Exit Code returns 404 (Not Ready for Exit)", lambda: res.status_code == 404)

    # Scenario 4: Reuse Return Code (Double Return)
    print("\n--- Scenario 4: Reuse Return Code ---")
    # op1 is COMPLETED.
    # Logic finds (return_code=code, status=CHECKED_OUT).
    # Since op1 is COMPLETED, it should fail.
    req = factory.post('/api/staff/dashboard/gate/process-code/', {'code': return_code})
    force_authenticate(req, user=gate)
    res = gate_view(req)
    run_test("Reusing Return Code returns 404 (Not Checked Out)", lambda: res.status_code == 404)

    # Scenario 5: Warden Vacate on Unapproved Request
    print("\n--- Scenario 5: Warden Vacate wrong status ---")
    op2 = create_outpass(student, Outpass.Status.PENDING)
    req = factory.post(f'/api/staff/dashboard/{op2.id}/warden_vacate/')
    force_authenticate(req, user=warden)
    res = warden_view(req, pk=op2.id)
    run_test("Warden Vacate fails on PENDING outpass", lambda: res.status_code == 400)

    # Cleanup
    op1.delete()
    op2.delete()
    print("\n--- Tests Complete ---")

if __name__ == '__main__':
    test_scenarios()

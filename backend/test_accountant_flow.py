import os
import django
import sys
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
approve_view = StaffDashboardViewSet.as_view({'post': 'accountant_approve'})
fee_pending_view = StaffDashboardViewSet.as_view({'post': 'mark_fee_pending'})

def get_or_create_user(role):
    user = User.objects.filter(role=role).first()
    if not user:
        user = User.objects.create(phone=f'888{random.randint(1000,9999)}', role=role)
        user.set_password('pass')
        user.save()
    return user

def run_test(name, assertion):
    try:
        if assertion():
            print(f"✅ PASS: {name}")
        else:
            print(f"❌ FAIL: {name}")
    except Exception as e:
        print(f"❌ ERROR: {name} - {str(e)}")

def test_accountant_flow():
    print("--- Starting Accountant Workflow Test ---")

    student = Student.objects.first()
    if not student:
        print("No student found.")
        return

    accountant = get_or_create_user(User.Roles.ACCOUNTANT)
    
    # Create a PENDING outpass
    outpass = Outpass.objects.create(
        student=student,
        parent=student.parent_relationships.first().parent if student.parent_relationships.exists() else User.objects.filter(role='PARENT').first(),
        reason="Accountant Test",
        outgoing_date=timezone.now().date(),
        outgoing_time=timezone.now().time(),
        expected_return_date=timezone.now().date(),
        expected_return_time=timezone.now().time(),
        status=Outpass.Status.PENDING
    )
    print(f"Created Outpass {outpass.id} (PENDING)")

    # 1. Mark Fee Pending
    print("\n[Step 1] Mark Fee Pending")
    req = factory.post(f'/api/staff/dashboard/{outpass.id}/accountant/fee-pending/', {'amount': 500})
    force_authenticate(req, user=accountant)
    res = fee_pending_view(req, pk=outpass.id)
    
    outpass.refresh_from_db()
    run_test("Status changed to FEE_PENDING", lambda: outpass.status == Outpass.Status.FEE_PENDING)
    run_test("Fee Due set to 500", lambda: outpass.fee_due == 500)

    # 2. Approve Fee (Mark Paid)
    print("\n[Step 2] Approve Fee (Mark Paid)")
    req = factory.post(f'/api/staff/dashboard/{outpass.id}/accountant/approve/')
    force_authenticate(req, user=accountant)
    res = approve_view(req, pk=outpass.id)

    outpass.refresh_from_db()
    run_test("Fee Paid is True", lambda: outpass.fee_paid is True)
    run_test("Status reset to PENDING", lambda: outpass.status == Outpass.Status.PENDING)

    # Cleanup
    outpass.delete()
    print("\n--- Accountant Test Complete ---")

if __name__ == '__main__':
    test_accountant_flow()

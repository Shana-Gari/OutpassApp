import os
import django
import sys
import uuid
from django.utils import timezone

sys.path.append('c:\\Users\\Shana\\Desktop\\OutpassApp\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from apps.outpasses.models import Outpass
from apps.users.models import User
from apps.students.models import Student
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.outpasses.views import StaffDashboardViewSet

def simulate_scan():
    # 1. Setup Data
    student = Student.objects.first()
    if not student:
        print("No student found.")
        return

    # Create a ready-for-exit outpass
    outpass = Outpass.objects.create(
        student=student,
        parent=student.parent_relationships.first().parent if student.parent_relationships.exists() else User.objects.filter(role='PARENT').first(),
        reason="Test Scan",
        outgoing_date=timezone.now().date(),
        outgoing_time=timezone.now().time(),
        expected_return_date=timezone.now().date(),
        expected_return_time=timezone.now().time(),
        status=Outpass.Status.READY_FOR_EXIT,
        qr_code=str(uuid.uuid4())
    )
    
    print(f"Created Test Outpass: {outpass.id}, QR: {outpass.qr_code}")

    # 2. Simulate Request
    factory = APIRequestFactory()
    view = StaffDashboardViewSet.as_view({'post': 'gate_scan'})
    
    gate_staff = User.objects.filter(role='GATE_STAFF').first()
    if not gate_staff:
        # Create dummy gate staff
        gate_staff = User.objects.create(phone='9999999999', role='GATE_STAFF')
        gate_staff.set_password('pass')
        gate_staff.save()
        print("Created dummy gate staff")

    request = factory.post('/api/staff/dashboard/gate/scan/', {'qr_code': outpass.qr_code}, format='json')
    force_authenticate(request, user=gate_staff)
    
    response = view(request)
    print(f"Response Status: {response.status_code}")
    print(f"Response Data: {response.data}")
    
    # Cleanup
    outpass.delete()

if __name__ == '__main__':
    simulate_scan()

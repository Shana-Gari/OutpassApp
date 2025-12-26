
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.students.models import Student, StudentParentRelationship, Guardian
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.students.views import GuardianViewSet

User = get_user_model()

def verify():
    # 1. Setup Data
    parent, _ = User.objects.get_or_create(phone='9876543210', role='PARENT', defaults={'first_name': 'TestParent'})
    
    s1, _ = Student.objects.get_or_create(student_id='S001', defaults={'first_name': 'Child1', 'admission_number': 'A001', 'date_of_birth': '2010-01-01', 'admission_date': '2023-01-01'})
    s2, _ = Student.objects.get_or_create(student_id='S002', defaults={'first_name': 'Child2', 'admission_number': 'A002', 'date_of_birth': '2012-01-01', 'admission_date': '2023-01-01'})
    
    StudentParentRelationship.objects.get_or_create(student=s1, parent=parent, defaults={'relationship': 'FATHER'})
    StudentParentRelationship.objects.get_or_create(student=s2, parent=parent, defaults={'relationship': 'FATHER'})
    
    # Clear existing guardians for test
    Guardian.objects.filter(student__in=[s1, s2]).delete()
    
    # 2. Simulate Request
    factory = APIRequestFactory()
    view = GuardianViewSet.as_view({'post': 'create'})
    
    data = {
        'name': 'Uncle John',
        'relationship': 'Uncle',
        'phone': '1122334455'
    }
    
    request = factory.post('/api/guardians/', data, format='json')
    force_authenticate(request, user=parent)
    
    response = view(request)
    
    print(f"Response Status: {response.status_code}")
    if response.status_code == 201:
        print("Response Data:", response.data)
        
    # 3. Verify Database
    g1 = Guardian.objects.filter(student=s1, name='Uncle John').exists()
    g2 = Guardian.objects.filter(student=s2, name='Uncle John').exists()
    
    print(f"Guardian for Child1: {g1}")
    print(f"Guardian for Child2: {g2}")
    
    if g1 and g2:
        print("SUCCESS: Guardian created for both children!")
    else:
        print("FAILURE: Guardian missing.")

if __name__ == "__main__":
    verify()

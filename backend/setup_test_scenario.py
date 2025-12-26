import os
import django
import sys
import datetime

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from apps.users.models import User
from apps.students.models import Student, StudentParentRelationship
from apps.housing.models import Hostel, Room
from apps.academic.models import Class, Section, AcademicYear

def setup_scenario_data():
    print("Setting up test scenario data...")

    # 1. Academic Structure
    ay, _ = AcademicYear.objects.get_or_create(
        name="2024-2025", 
        defaults={
            "start_date": "2024-01-01", 
            "end_date": "2025-01-01", 
            "is_current": True
        }
    )
    
    class_obj, _ = Class.objects.get_or_create(name="10", code="10th")
    section, _ = Section.objects.get_or_create(name="A", class_obj=class_obj)

    # 2. Housing Structure
    warden = User.objects.filter(role='WARDEN', phone='2222222222').first()
    if not warden:
        warden = User.objects.create_user(phone='2222222222', password='password', role='WARDEN', first_name='Warden A')
        warden.set_password('2222222222')
        warden.save()
        print("Created Warden: 2222222222")

    hostel, _ = Hostel.objects.get_or_create(
        name="Hostel A", 
        defaults={
            "type": "BOYS", 
            "warden": warden
        }
    )
    if hostel.warden != warden:
        hostel.warden = warden
        hostel.save()
        print("Assigned Warden to Hostel")

    room, _ = Room.objects.get_or_create(
        hostel=hostel,
        room_number="101",
        defaults={"floor": 1}
    )

    # 3. Users
    def ensure_user(phone, role, fname):
        u = User.objects.filter(phone=phone).first()
        if not u:
            u = User.objects.create_user(phone=phone, password=phone, role=role, first_name=fname)
            print(f"Created {role}: {phone}")
        else:
            if not u.check_password(phone):
                u.set_password(phone)
                u.save()
            print(f"Verified {role}: {phone}")
        return u

    hm = ensure_user('1111111111', 'HM', 'Headmaster')
    gate = ensure_user('3333333333', 'GATE_STAFF', 'GateKeeper') # Checking Role choice 'GATE_STAFF'
    parent_user = ensure_user('9876543210', 'PARENT', 'Parent A')
    
    # 4. Student Setup
    student_user = ensure_user('4444444444', 'STUDENT', 'Student A') # Assuming USER role also STUDENT? or User not needed if Student model handles auth?
    # Actually Model definitions show Student has NO OneToOne to User directly in what I read? 
    # Wait, Student model source I read:
    # class Student(models.Model): ... first_name, last_name, etc. NO User FK!
    # BUT `student_id` is CharField unique.
    # User model has `username=None`, `USERNAME_FIELD='phone'`.
    # How does Student login? Maybe they don't? Students might not have logins yet or they are just data objects managed by Parents/Staff?
    # BUT if User role has 'STUDENT', it implies login.
    # Let's check if User has a generic relation or if I missed something.
    # `Student.email` is there.
    # The requirement says `Parent (Mobile App)`, `Warden`, etc. `Student` is not explicitly listed as a User Role with Login in the prompt "User Roles & Functionalities".
    # Scenario A says "Parent/Student opens the App". Parent opens it.
    # So Student might just be a data record.
    
    # Let's create the Student Record.
    student_profile, created = Student.objects.get_or_create(
        student_id='STU001',
        defaults={
            'first_name': 'Student',
            'last_name': 'A',
            'date_of_birth': '2010-01-01',
            'gender': 'M',
            'class_obj': class_obj,
            'section': section,
            'hostel': hostel,
            'room': room,
            'admission_date': '2023-01-01',
            'roll_number': '1'
        }
    )
    if created:
        print("Created Student Profile: STU001")
    else:
        print("Existing Student Profile: STU001")

    # 5. Link Parent to Student
    spr, created = StudentParentRelationship.objects.get_or_create(
        student=student_profile,
        parent=parent_user,
        defaults={
            'relationship': 'FATHER',
            'is_primary': True
        }
    )
    if created:
        print("Linked Student to Parent")
    else:
        print("Link already exists")

    print("Data setup complete.")

if __name__ == '__main__':
    setup_scenario_data()

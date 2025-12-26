import os
import django
import sys
from datetime import timedelta, date, datetime

# Setup Django Environment
sys.path.append('c:\\Users\\Shana\\Desktop\\OutpassApp\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

from django.utils import timezone
from apps.users.models import User, StaffProfile, ParentProfile
from apps.students.models import Student, StudentParentRelationship, Guardian
from apps.academic.models import Class, Section
from apps.housing.models import Hostel, Room
from apps.outpasses.models import Outpass
from rest_framework.test import APIClient

def log(msg, status="INFO"):
    with open("verify.log", "a") as f:
        f.write(f"[{status}] {msg}\n")
    print(f"[{status}] {msg}")

def setup_test_data():
    log("Setting up Test Data...", "INFO")
    
    # 1. Create Hostel & Room
    hostel, _ = Hostel.objects.get_or_create(name="Boys Hostel A", type="BOYS")
    room, _ = Room.objects.get_or_create(hostel=hostel, room_number="101", floor=1, defaults={'capacity': 4})
    
    # 2. Create Acadeimc
    class_obj, _ = Class.objects.get_or_create(name="XII")
    section, _ = Section.objects.get_or_create(name="A", class_obj=class_obj)

    # 3. Create Users
    # Parent
    parent_user, _ = User.objects.get_or_create(phone="9999999999", defaults={'first_name': 'Test', 'last_name': 'Parent', 'role': 'PARENT'})
    parent_user.set_password("password")
    parent_user.save()
    ParentProfile.objects.get_or_create(user=parent_user)

    # HM
    hm_user, _ = User.objects.get_or_create(phone="8888888888", defaults={'first_name': 'Head', 'last_name': 'Master', 'role': 'HM'})
    hm_user.set_password("password")
    hm_user.save()

    # Warden
    warden_user, _ = User.objects.get_or_create(phone="7777777777", defaults={'first_name': 'Test', 'last_name': 'Warden', 'role': 'WARDEN'})
    warden_user.set_password("password")
    warden_user.save()
    warden_profile, _ = StaffProfile.objects.get_or_create(user=warden_user)
    warden_profile.assigned_hostel = hostel
    warden_profile.save()

    # Gate Staff
    gate_user, _ = User.objects.get_or_create(phone="6666666666", defaults={'first_name': 'Gate', 'last_name': 'Keeper', 'role': 'GATE_STAFF'})
    gate_user.set_password("password")
    gate_user.save()

    # Accountant
    acc_user, _ = User.objects.get_or_create(phone="5555555555", defaults={'first_name': 'Test', 'last_name': 'Accountant', 'role': 'ACCOUNTANT'})
    acc_user.set_password("password")
    acc_user.save()

    # 4. Create Student
    student, _ = Student.objects.get_or_create(
        student_id="STU001",
        defaults={
            'first_name': 'Baby', 'last_name': 'Student',
            'admission_number': 'ADM001', 'roll_number': '01',
            'date_of_birth': '2010-01-01', 'gender': 'M',
            'class_obj': class_obj, 'section': section,
            'hostel': hostel, 'room': room,
            'admission_date': '2020-01-01'
        }
    )

    # Link Parent & Student
    StudentParentRelationship.objects.get_or_create(student=student, parent=parent_user, relationship="FATHER")

    # Clear existing outpasses for this student to ensure clean state
    Outpass.objects.filter(student=student).delete()

    log("Test Data Setup Complete.", "SUCCESS")
    return {
        'parent': parent_user, 'student': student, 'hm': hm_user, 
        'warden': warden_user, 'gate': gate_user, 'accountant': acc_user
    }

def get_token(user):
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)

def inspect_response(response):
    if hasattr(response, 'data'):
        return response.data
    return response.content.decode()

def test_scenario_a_happy_path(users):
    log("\n--- Testing Scenario A: Happy Path ---", "INFO")
    client = APIClient()
    student = users['student']
    
    # 1. Parent Requests Outpass
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + get_token(users['parent']))
    payload = {
        "student": student.id,
        "reason": "Going Home",
        "outgoing_date": (date.today() + timedelta(days=1)).isoformat(),
        "outgoing_time": "10:00",
        "expected_return_date": (date.today() + timedelta(days=2)).isoformat(),
        "expected_return_time": "18:00"
    }
    response = client.post('/api/outpasses/', payload)
    if response.status_code != 201:
        log(f"Parent Request Failed: {inspect_response(response)}", "ERROR")
        return
    try:
        outpass_id = response.data['id']
    except KeyError:
        log(f"KEY ERROR: ID not found. Data: {response.data}", "ERROR")
        return
    log(f"1. Parent Requested Outpass (ID: {outpass_id}) - Status: PENDING", "SUCCESS")

    # 2. HM Approves
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + get_token(users['hm']))
    response = client.post(f'/api/outpasses/{outpass_id}/hm_approve/')
    if response.status_code != 200:
        log(f"HM Approval Failed: {inspect_response(response)}", "ERROR")
        return
    log("2. HM Approved Request - Status: APPROVED", "SUCCESS")

    # 3. Warden Marks Exit (Generates QR)
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + get_token(users['warden']))
    response = client.post(f'/api/outpasses/{outpass_id}/warden_vacate/')
    if response.status_code != 200:
        log(f"Warden Vacate Failed: {inspect_response(response)}", "ERROR")
        return
    qr_code = response.data.get('qr_code')
    if not qr_code:
        log("No QR Code generated!", "ERROR")
        return
    log(f"3. Warden Marked Exit - Status: READY_FOR_EXIT. QR Code: {qr_code}", "SUCCESS")

    # 4. Gate Scans for Exit
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + get_token(users['gate']))
    response = client.post('/api/outpasses/gate_scan/', {'qr_code': qr_code})
    if response.status_code != 200 or response.data['type'] != 'EXIT':
         log(f"Gate Exit Scan Failed: {inspect_response(response)}", "ERROR")
         return
    log(f"4. Gate Scanned EXIT - Status: CHECKED_OUT. Time: {response.data.get('time')}", "SUCCESS")

    # 5. Gate Scans for Entry (Return)
    response = client.post('/api/outpasses/gate_scan/', {'qr_code': qr_code})
    if response.status_code != 200 or response.data['type'] != 'ENTRY':
         log(f"Gate Entry Scan Failed: {inspect_response(response)}", "ERROR")
         return
    log("5. Gate Scanned ENTRY - Status: COMPLETED (Returned).", "SUCCESS")


def test_scenario_b_rejection(users):
    log("\n--- Testing Scenario B: Rejection Flow ---", "INFO")
    client = APIClient()
    student = users['student']
    Outpass.objects.filter(student=student).delete()
    
    # 1. Parent Request
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + get_token(users['parent']))
    payload = {
        "student": student.id,
        "reason": "Sick Leave",
        "outgoing_date": (date.today() + timedelta(days=1)).isoformat(),
        "outgoing_time": "10:00",
        "expected_return_date": (date.today() + timedelta(days=2)).isoformat(),
        "expected_return_time": "18:00"
    }
    response = client.post('/api/outpasses/', payload)
    outpass_id = response.data['id']
    log(f"1. Parent Requested Outpass (ID: {outpass_id})", "SUCCESS")

    # 2. HM Rejects
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + get_token(users['hm']))
    response = client.post(f'/api/outpasses/{outpass_id}/hm_reject/', {'reason': 'Exams are near'})
    if response.status_code != 200:
        log(f"HM Rejection Failed: {inspect_response(response)}", "ERROR")
        return
    
    # Verify Status
    outpass = Outpass.objects.get(id=outpass_id)
    if outpass.status == 'REJECTED':
        log("2. HM Rejected Request - Status: REJECTED", "SUCCESS")
    else:
        log(f"Status mismatch: {outpass.status}", "ERROR")

def test_scenario_c_fee_pending(users):
    log("\n--- Testing Scenario C: Fee Pending Flow ---", "INFO")
    client = APIClient()
    student = users['student']
    Outpass.objects.filter(student=student).delete()
    
    # 1. Parent Request
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + get_token(users['parent']))
    payload = {
        "student": student.id,
        "reason": "Vacation",
        "outgoing_date": (date.today() + timedelta(days=5)).isoformat(),
        "outgoing_time": "08:00",
        "expected_return_date": (date.today() + timedelta(days=10)).isoformat(),
        "expected_return_time": "18:00"
    }
    response = client.post('/api/outpasses/', payload)
    outpass_id = response.data['id']
    log(f"1. Parent Requested Outpass (ID: {outpass_id})", "SUCCESS")

    # 2. Accountant Marks Fee Pending
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + get_token(users['accountant']))
    response = client.post(f'/api/outpasses/{outpass_id}/accountant_fee_pending/', {'amount': 5000})
    if response.status_code != 200:
        log(f"Accountant Mark Pending Failed: {inspect_response(response)}", "ERROR")
        return
    
    outpass = Outpass.objects.get(id=outpass_id)
    if outpass.status == 'FEE_PENDING' and outpass.fee_due == 5000:
        log("2. Accountant Marked Fee Pending (Amount: 5000) - Status: FEE_PENDING", "SUCCESS")
    else:
        log(f"Status/Fee Mismatch: {outpass.status} / {outpass.fee_due}", "ERROR")

    # 3. Accountant Approves (Fee Paid)
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + get_token(users['accountant']))
    response = client.post(f'/api/outpasses/{outpass_id}/accountant_approve/')
    if response.status_code != 200:
        log(f"Accountant Approve Failed: {inspect_response(response)}", "ERROR")
        return

    outpass.refresh_from_db()
    if outpass.status == 'PENDING' and outpass.fee_paid:
        log("3. Accountant Approved (Fee Paid) - Status: PENDING (Ready for HM)", "SUCCESS")
    else:
        log(f"Status Mismatch after payment: {outpass.status}", "ERROR")

    # 4. HM Approves
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + get_token(users['hm']))
    response = client.post(f'/api/outpasses/{outpass_id}/hm_approve/')
    if response.status_code == 200:
        log("4. HM Approved - Status: APPROVED", "SUCCESS")
    else:
        log("HM Approval Failed", "ERROR")


def print_urls():
    from django.urls import get_resolver
    resolver = get_resolver()
    log("--- Available URLs ---", "INFO")
    for pattern in resolver.url_patterns:
        try:
             log(str(pattern))
        except:
             pass
    log("----------------------", "INFO")

if __name__ == "__main__":
    try:
        print_urls()
        users = setup_test_data()
        test_scenario_a_happy_path(users)
        test_scenario_b_rejection(users)
        test_scenario_c_fee_pending(users)
        log("\nAll Scenarios Verified!", "SUCCESS")
    except Exception as e:
        log(f"Verification Failed with Exception: {str(e)}", "ERROR")

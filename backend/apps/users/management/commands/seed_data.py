from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.students.models import Student, StudentParentRelationship
from apps.users.models import StaffProfile, ParentProfile
from apps.housing.models import Hostel, Room
from apps.academic.models import Class, Section, AcademicYear
import random
import traceback

User = get_user_model()
DEFAULT_PASS = 'IES_SDA'

class Command(BaseCommand):
    help = 'Seeds database with sample data'

    def add_arguments(self, parser):
        parser.add_argument('--flush', action='store_true', help='Flush data before seeding')

    def handle(self, *args, **options):
        try:
            if options['flush']:
                self.stdout.write('Flushing data...')
                StudentParentRelationship.objects.all().delete()
                Student.objects.all().delete()
                StaffProfile.objects.all().delete()
                ParentProfile.objects.all().delete()
                User.objects.exclude(is_superuser=True).delete()
                Room.objects.all().delete()
                Hostel.objects.all().delete()
                Section.objects.all().delete()
                Class.objects.all().delete()
                AcademicYear.objects.all().delete()
                self.stdout.write('Data cleared.')

            self.stdout.write('Seeding data...')
            
            # 1. Academic Year
            ay, _ = AcademicYear.objects.get_or_create(name='2024-2025', defaults={'start_date': '2024-04-01', 'end_date': '2025-03-31', 'is_current': True})
            
            # 2. Classes & Sections
            classes = []
            for name in ['10', '11', '12']:
                c, _ = Class.objects.get_or_create(name=name, defaults={'code': name})
                classes.append(c)
                for sec in ['A', 'B']:
                    Section.objects.get_or_create(name=sec, class_obj=c)

            # 3. Hostels
            bh, _ = Hostel.objects.get_or_create(name='Boys Hostel A', defaults={'type': 'BOYS'})
            gh, _ = Hostel.objects.get_or_create(name='Girls Hostel B', defaults={'type': 'GIRLS'})
            
            # Rooms
            for h in [bh, gh]:
                for i in range(1, 11):
                    # Room needs unique number per hostel? unique_hostel_room constraint
                    Room.objects.get_or_create(room_number=f"{100+i}", hostel=h, defaults={'floor': 1, 'capacity': 4})

            # 4. Users
            
            # Admin (Traditional)
            if not User.objects.filter(role='ADMIN').exists():
                if not User.objects.filter(is_superuser=True).exists():
                     User.objects.create_superuser('admin', 'admin', email='admin@school.com')

            # Admin (Dedicated Phone)
            admin_phone = '9999999900'
            if not User.objects.filter(phone=admin_phone).exists():
                User.objects.create_superuser(admin_phone, 'admin', email='admin@school.com')
            else:
                # Ensure it has admin privileges if it already exists (e.g. from previous runs)
                u = User.objects.get(phone=admin_phone)
                if not u.is_superuser or u.role != 'ADMIN':
                    u.is_superuser = True
                    u.is_staff = True
                    u.role = 'ADMIN'
                    u.save()

            # Staff - Warden Boys
            warden_b, created = User.objects.get_or_create(phone='9876543210', defaults={
                'first_name': 'Ramesh', 'last_name': 'Warden', 'role': 'WARDEN', 'is_verified': True
            })
            if created: 
                warden_b.set_password('9876543210')
                warden_b.save()
                StaffProfile.objects.get_or_create(user=warden_b, defaults={'designation': 'Senior Warden', 'assigned_hostel': bh})

            # Staff - Warden Girls
            warden_g, created = User.objects.get_or_create(phone='9876543211', defaults={
                'first_name': 'Suresh', 'last_name': 'Warden', 'role': 'WARDEN', 'is_verified': True
            })
            if created:
                warden_g.set_password('9876543211')
                warden_g.save()
                StaffProfile.objects.get_or_create(user=warden_g, defaults={'designation': 'Senior Warden', 'assigned_hostel': gh})

            # Staff - HM
            hm, created = User.objects.get_or_create(phone='9999999999', defaults={
                'first_name': 'Dr.', 'last_name': 'Principal', 'role': 'HM', 'is_verified': True
            })
            if created:
                hm.set_password('9999999999')
                hm.save()
                StaffProfile.objects.get_or_create(user=hm, defaults={'designation': 'Principal'})
            
            # Staff - Gate
            gate, created = User.objects.get_or_create(phone='8888888888', defaults={
                'first_name': 'Gate', 'last_name': 'Keeper', 'role': 'GATE_STAFF', 'is_verified': True
            })
            if created:
                gate.set_password('8888888888')
                gate.save()
                StaffProfile.objects.get_or_create(user=gate, defaults={'designation': 'Security', 'gate_number': '1'})

            self.stdout.write('Staff created.')

            # 5. Students & Parents
            
            def create_family(fam_id, student_name, gender, hostel, cls_name):
                # Parent
                p_phone = f'90000000{fam_id:02d}'
                parent, p_created = User.objects.get_or_create(phone=p_phone, defaults={
                    'first_name': f'Parent{fam_id}', 'last_name': 'Sharma', 'email': f'parent{fam_id}@test.com', 'role': 'PARENT', 'is_verified': True
                })
                if p_created:
                    parent.set_password(p_phone)
                    parent.save()
                    ParentProfile.objects.get_or_create(user=parent, defaults={'occupation': 'Engineer'})

                # Student
                cls = Class.objects.get(name=cls_name)
                sec = cls.sections.first() # Using related_name 'sections' from Section model logic? No, Section has 'class_obj' related_name='sections'.
                s_adm = f'ADM24{fam_id:03d}'
                student, s_created = Student.objects.get_or_create(student_id=s_adm, defaults={
                    'first_name': student_name, 'last_name': 'Sharma',
                    'admission_number': s_adm, 'roll_number': f'{10+fam_id}',
                    'gender': gender, 'date_of_birth': '2008-01-01',
                    'class_obj': cls, 'section': sec,
                    'hostel': hostel, 'room': hostel.rooms.first(),
                    'personal_phone': p_phone, 
                    'admission_date': timezone.now().date()
                })

                if s_created:
                    # Check unique constraint first
                    if not StudentParentRelationship.objects.filter(student=student, parent=parent).exists():
                        StudentParentRelationship.objects.create(student=student, parent=parent, relationship='FATHER', is_primary=True)

            # Create 10 families
            for i in range(1, 6):
                create_family(i, f'BoyStudent{i}', 'M', bh, '12')
            for i in range(6, 11):
                create_family(i, f'GirlStudent{i}', 'F', gh, '11')

            self.stdout.write(self.style.SUCCESS(f'Database seeded successfully! Password is now same as Phone Number for all users.'))

        except Exception as e:
            self.stderr.write(self.style.ERROR(f'Error: {str(e)}'))
            self.stderr.write(self.style.ERROR(traceback.format_exc()))

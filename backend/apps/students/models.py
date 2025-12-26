import uuid
from django.db import models

class Student(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student_id = models.CharField(max_length=20, unique=True)
    admission_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')])
    blood_group = models.CharField(max_length=5, blank=True)
    roll_number = models.CharField(max_length=20)
    
    # Academic
    class_obj = models.ForeignKey('academic.Class', on_delete=models.SET_NULL, null=True, related_name='students', db_column='class_id')
    section = models.ForeignKey('academic.Section', on_delete=models.SET_NULL, null=True, related_name='students')
    
    # Housing
    is_hosteller = models.BooleanField(default=True)
    hostel = models.ForeignKey('housing.Hostel', on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    room = models.ForeignKey('housing.Room', on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    
    # Contact & Medical
    email = models.EmailField(blank=True, null=True)
    personal_phone = models.CharField(max_length=15, blank=True, null=True)
    medical_conditions = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=15, blank=True)
    
    photo = models.URLField(max_length=255, blank=True, null=True)
    id_card_photo = models.URLField(max_length=255, blank=True, null=True)
    
    is_active = models.BooleanField(default=True)
    admission_date = models.DateField()
    leaving_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['student_id', 'is_active']),
            models.Index(fields=['class_obj', 'section']),
        ]
        constraints = [
            models.UniqueConstraint(fields=['class_obj', 'section', 'roll_number'], name='unique_class_section_roll_no')
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.student_id})"


class StudentParentRelationship(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='parent_relationships')
    parent = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='student_relationships')
    relationship = models.CharField(max_length=20)  # e.g., FATHER, MOTHER
    is_primary = models.BooleanField(default=False)
    is_emergency_contact = models.BooleanField(default=False)
    can_create_outpass = models.BooleanField(default=True)
    can_pickup = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['student', 'parent'], name='unique_student_parent')
        ]


class Guardian(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='guardians')
    name = models.CharField(max_length=100)
    relationship = models.CharField(max_length=50)
    phone = models.CharField(max_length=15)
    alt_phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True)
    photo = models.URLField(max_length=255, blank=True, null=True)
    
    # ID Proof
    id_proof_type = models.CharField(max_length=50, blank=True)
    id_proof_number = models.CharField(max_length=50, blank=True)
    id_proof_document = models.URLField(max_length=255, blank=True, null=True)
    
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_guardians')
    approved_date = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    added_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='added_guardians')
    is_emergency_contact = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['student', 'phone'], name='unique_student_guardian_phone')
        ]

import uuid
from django.db import models

class Outpass(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        FEE_PENDING = 'FEE_PENDING', 'Fee Pending'
        APPROVED = 'APPROVED', 'Approved'
        READY_FOR_EXIT = 'READY_FOR_EXIT', 'Ready for Exit'
        REJECTED = 'REJECTED', 'Rejected'
        CANCELLED = 'CANCELLED', 'Cancelled'
        MEETING = 'MEETING', 'Meeting'
        CHECKED_OUT = 'CHECKED_OUT', 'Checked Out'
        COMPLETED = 'COMPLETED', 'Completed (Returned)'
        EXPIRED = 'EXPIRED', 'Expired'
        OVERDUE = 'OVERDUE', 'Overdue'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='outpasses')
    parent = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='requested_outpasses')
    guardian = models.ForeignKey('students.Guardian', on_delete=models.SET_NULL, null=True, blank=True, related_name='pickup_outpasses')
    
    # Pickup details if not registered guardian
    pickup_person_name = models.CharField(max_length=100, blank=True)
    pickup_person_phone = models.CharField(max_length=15, blank=True)
    pickup_person_relation = models.CharField(max_length=50, blank=True)
    
    requested_at = models.DateTimeField(auto_now_add=True)
    outgoing_date = models.DateField()
    outgoing_time = models.TimeField()
    expected_return_date = models.DateField()
    expected_return_time = models.TimeField()
    actual_return_date = models.DateTimeField(null=True, blank=True)
    
    reason = models.TextField()
    destination = models.CharField(max_length=200, blank=True)
    mode_of_travel = models.CharField(max_length=100, blank=True)
    
    is_priority = models.BooleanField(default=False)
    priority_reason = models.TextField(blank=True)
    priority_level = models.IntegerField(default=0)  # 1=Low, 2=Medium, 3=High
    
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.PENDING)
    
    # QR & Verification
    qr_code = models.TextField(blank=True)  # Store JWT token or hash
    qr_generated_at = models.DateTimeField(null=True, blank=True)
    checkout_time = models.DateTimeField(null=True, blank=True)
    checked_out_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='checked_out_outpasses')
    gate_number = models.CharField(max_length=20, blank=True)
    verification_photo = models.URLField(max_length=255, blank=True, null=True)
    
    # 2-Step Code System
    exit_code = models.CharField(max_length=6, blank=True)
    return_code = models.CharField(max_length=6, blank=True)
    
    # HM specific
    meeting_scheduled = models.BooleanField(default=False)
    meeting_date = models.DateTimeField(null=True, blank=True)
    meeting_venue = models.CharField(max_length=200, blank=True) # Added
    meeting_notes = models.TextField(blank=True)
    
    # Accountant
    fee_due = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    fee_paid = models.BooleanField(default=False)
    fee_paid_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['status', 'is_priority']),
            models.Index(fields=['outgoing_date', 'expected_return_date']),
        ]

    def __str__(self):
        return f"{self.student.first_name} - {self.status}"


class Approval(models.Model):
    class Status(models.TextChoices):
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        PENDING = 'PENDING', 'Pending'
        REVIEW_REQUESTED = 'REVIEW', 'Review Requested'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    outpass = models.ForeignKey(Outpass, on_delete=models.CASCADE, related_name='approvals')
    approver = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    approver_role = models.CharField(max_length=20)  # PARENT, ACCOUNTANT, WARDEN, HM
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    comments = models.TextField(blank=True)
    
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    meeting_date = models.DateTimeField(null=True, blank=True)
    
    approved_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['outpass', 'approver_role'], name='unique_outpass_approval_role')
        ]

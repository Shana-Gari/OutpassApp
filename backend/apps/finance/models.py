import uuid
from django.db import models

class FeeType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class StudentFee(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='fees')
    fee_type = models.ForeignKey(FeeType, on_delete=models.CASCADE)
    academic_year = models.ForeignKey('academic.AcademicYear', on_delete=models.CASCADE)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    paid_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, default='PENDING')  # PENDING, PAID, PARTIAL, OVERDUE
    
    outpass = models.ForeignKey('outpasses.Outpass', on_delete=models.SET_NULL, null=True, blank=True, related_name='related_fees')

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['student', 'fee_type', 'academic_year'], name='unique_student_fee')
        ]

class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student_fee = models.ForeignKey(StudentFee, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    payment_method = models.CharField(max_length=50)
    transaction_id = models.CharField(max_length=100, blank=True)
    receipt_number = models.CharField(max_length=50, unique=True)
    collected_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)

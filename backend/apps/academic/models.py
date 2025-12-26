import uuid
from django.db import models

class AcademicYear(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)  # e.g., "2024-2025"
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class Class(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)  # e.g., "10th"
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Section(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='sections', db_column='class_id')
    name = models.CharField(max_length=10)  # "A", "B"
    capacity = models.IntegerField(default=40)
    class_teacher = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='class_teacher_of')

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['class_obj', 'name'], name='unique_class_section')
        ]

    def __str__(self):
        return f"{self.class_obj.name} - {self.name}"

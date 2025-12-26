import uuid
from django.db import models

class Hostel(models.Model):
    class Types(models.TextChoices):
        BOYS = 'BOYS', 'Boys'
        GIRLS = 'GIRLS', 'Girls'
        COED = 'COED', 'Co-Ed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=Types.choices)
    current_occupancy = models.IntegerField(default=0)
    warden = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='warden_of')

    def __str__(self):
        return self.name

class Room(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE, related_name='rooms')
    room_number = models.CharField(max_length=20)
    floor = models.IntegerField()
    capacity = models.IntegerField(default=2)
    current_occupancy = models.IntegerField(default=0)
    is_available = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['hostel', 'room_number'], name='unique_hostel_room')
        ]

    def __str__(self):
        return f"{self.hostel.name} - {self.room_number}"

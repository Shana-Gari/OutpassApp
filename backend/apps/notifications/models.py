import uuid
from django.db import models

class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50)
    title = models.CharField(max_length=200)
    message = models.TextField()
    priority = models.CharField(max_length=10, default='MEDIUM')
    
    related_model = models.CharField(max_length=50, blank=True)
    related_id = models.UUIDField(null=True, blank=True)
    data = models.JSONField(default=dict)
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'is_read']),
        ]

import uuid
from django.db import models

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    user_role = models.CharField(max_length=20, blank=True)
    ip_address = models.CharField(max_length=45, blank=True)
    user_agent = models.TextField(blank=True)
    
    model_name = models.CharField(max_length=100)
    object_id = models.UUIDField()
    action = models.CharField(max_length=20)  # CREATE, UPDATE, DELETE
    description = models.TextField()
    
    old_values = models.JSONField(null=True, blank=True)
    new_values = models.JSONField(null=True, blank=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['model_name', 'object_id']),
        ]

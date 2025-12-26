from rest_framework import serializers
from .models import Hostel, Room

class HostelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hostel
        fields = ['id', 'name', 'type', 'current_occupancy']

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'

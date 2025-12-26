from django.utils import timezone
import uuid
from rest_framework import serializers
from .models import Student, StudentParentRelationship, Guardian

class StudentParentRelationshipSerializer(serializers.ModelSerializer):
    parent_name = serializers.ReadOnlyField(source='parent.first_name')
    parent_phone = serializers.ReadOnlyField(source='parent.phone')
    parent_email = serializers.ReadOnlyField(source='parent.email')

    class Meta:
        model = StudentParentRelationship
        fields = ['id', 'parent_name', 'relationship', 'parent_phone', 'parent_email', 'is_primary', 'is_emergency_contact']

class GuardianSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.first_name')
    added_by_name = serializers.ReadOnlyField(source='added_by.first_name')

    class Meta:
        model = Guardian
        fields = '__all__'
        read_only_fields = ['is_approved', 'approved_by', 'approved_date', 'added_by', 'student_name', 'added_by_name']

    def validate(self, data):
        request = self.context.get('request')
        student = data.get('student')
        
        if request and request.user and request.user.role == 'PARENT' and student:
            if not StudentParentRelationship.objects.filter(student=student, parent=request.user).exists():
                raise serializers.ValidationError("You can only add guardians for your own children.")
        return data

class StudentSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(required=False)
    admission_date = serializers.DateField(required=False)
    parents = StudentParentRelationshipSerializer(source='parent_relationships', many=True, read_only=True)
    guardians = GuardianSerializer(many=True, read_only=True)
    
    # Read-only display fields
    class_name = serializers.ReadOnlyField(source='class_obj.name')
    section_name = serializers.ReadOnlyField(source='section.name')
    hostel_name = serializers.ReadOnlyField(source='hostel.name')
    room_number = serializers.ReadOnlyField(source='room.room_number')

    class Meta:
        model = Student
        fields = '__all__'

    def validate(self, data):
        # Auto-generate student_id if missing
        if 'student_id' not in data:
            data['student_id'] = data.get('admission_number') or str(uuid.uuid4())[:8].upper()
        
        # Default admission_date to today
        if 'admission_date' not in data:
            data['admission_date'] = timezone.now().date()

        # Handle empty string for ForeignKeys
        for field in ['hostel', 'room', 'class_obj', 'section']:
            if field in data and data[field] == "":
                data[field] = None
                
        return data

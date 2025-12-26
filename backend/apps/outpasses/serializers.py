from rest_framework import serializers
from .models import Outpass, Approval
from apps.users.serializers import UserSerializer
from apps.students.models import Student

class OutpassSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.first_name', read_only=True)
    student_roll_no = serializers.CharField(source='student.roll_number', read_only=True)
    student_class = serializers.CharField(source='student.class_obj.name', read_only=True)
    student_section = serializers.CharField(source='student.section.name', read_only=True)
    parent_name = serializers.CharField(source='parent.first_name', read_only=True)
    
    class Meta:
        model = Outpass
        fields = '__all__'
        read_only_fields = ('status', 'qr_code', 'qr_generated_at', 'checkout_time', 'checked_out_by', 'gate_number', 'fee_paid_at', 'meeting_scheduled', 'meeting_date', 'fee_due', 'parent', 'exit_code', 'return_code')

    def validate(self, data):
        student = data.get('student')
        if student:
            active_outpasses = Outpass.objects.filter(
                student=student,
            ).exclude(
                status__in=[
                    Outpass.Status.COMPLETED,
                    Outpass.Status.REJECTED,
                    Outpass.Status.CANCELLED,
                    Outpass.Status.EXPIRED
                ]
            )
            
            # If we are updating, exclude the current instance
            if self.instance:
                active_outpasses = active_outpasses.exclude(id=self.instance.id)
                
            if active_outpasses.exists():
                raise serializers.ValidationError(
                    f"Student {student.first_name} already has an active outpass request. Please complete or cancel it before requesting a new one."
                )

            # Security Check: Ensure parent owns this student
            request = self.context.get('request')
            if request and request.user and request.user.role == 'PARENT':
                from apps.students.models import StudentParentRelationship
                if not StudentParentRelationship.objects.filter(student=student, parent=request.user).exists():
                    raise serializers.ValidationError(
                        "You can only request outpasses for your own registered children."
                    )
        return data

    def create(self, validated_data):
        # Automatically set parent from context request user
        request = self.context.get('request')
        if request and request.user:
             validated_data['parent'] = request.user
        return super().create(validated_data)

class ApprovalSerializer(serializers.ModelSerializer):
    approver_name = serializers.ReadOnlyField(source='approver.first_name')
    
    class Meta:
        model = Approval
        fields = ['id', 'approver_role', 'approver_name', 'status', 'comments', 'approved_at', 'updated_at']

class DashboardOutpassSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.first_name', read_only=True)
    student_roll_no = serializers.CharField(source='student.roll_number', read_only=True)
    student_class = serializers.CharField(source='student.class_obj.name', read_only=True)
    student_section = serializers.CharField(source='student.section.name', read_only=True)
    parent_name = serializers.CharField(source='parent.first_name', read_only=True)
    parent_phone = serializers.CharField(source='parent.phone', read_only=True)
    student_hostel = serializers.CharField(source='student.hostel.name', read_only=True)
    student_room = serializers.CharField(source='student.room.number', read_only=True)
    approvals = ApprovalSerializer(many=True, read_only=True)
    
    class Meta:
        model = Outpass
        fields = ['id', 'student_name', 'student_roll_no', 'student_class', 'student_section', 'student_hostel', 'student_room', 'parent_name', 'parent_phone', 'reason', 'outgoing_date', 'outgoing_time', 'expected_return_date', 'expected_return_time', 'status', 'is_priority', 'fee_due', 'fee_paid', 'fee_paid_at', 'meeting_scheduled', 'meeting_date', 'meeting_venue', 'verification_photo', 'exit_code', 'return_code', 'approvals']

class FeePendingSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)

class MeetingSerializer(serializers.Serializer):
    date = serializers.DateTimeField() # Use ISO 8601 string
    venue = serializers.CharField(max_length=200)
    reason = serializers.CharField(required=False, allow_blank=True)

class VacateSerializer(serializers.Serializer):
    # live_image = serializers.ImageField(required=False) # Optional for now
    pass

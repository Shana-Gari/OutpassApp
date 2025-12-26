from rest_framework import viewsets, permissions, views, status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Student, StudentParentRelationship, Guardian
from .serializers import StudentSerializer, GuardianSerializer
from rest_framework.decorators import action
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter

User = get_user_model()

class LinkStudentView(views.APIView):
    permission_classes = [permissions.IsAuthenticated] # Should be IsAdminUser eventually

    def post(self, request):
        parent_id = request.data.get('parent_id')
        admission_number = request.data.get('admission_number')
        relationship = request.data.get('relationship', 'PARENT')

        # 1. Validate Parent
        try:
            parent = User.objects.get(id=parent_id, role='PARENT')
        except User.DoesNotExist:
             return Response({"error": "Parent not found"}, status=status.HTTP_404_NOT_FOUND)

        # 2. Validate Student
        try:
            student = Student.objects.get(admission_number=admission_number)
        except Student.DoesNotExist:
             return Response({"error": "Student not found with admission number"}, status=status.HTTP_404_NOT_FOUND)

        # 3. Create Relationship
        obj, created = StudentParentRelationship.objects.get_or_create(
            student=student,
            parent=parent,
            defaults={'relationship': relationship, 'is_primary': True}
        )
        
        if created:
             return Response({"message": "Student linked successfully"}, status=status.HTTP_201_CREATED)
        else:
             return Response({"message": "Link already exists"}, status=status.HTTP_200_OK)

class StudentViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        user = self.request.user
        if user.role == 'PARENT':
            return Student.objects.filter(parent_relationships__parent=user)
        return Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['first_name', 'admission_number', 'parent_relationships__parent__phone']
    filterset_fields = ['section', 'class_obj', 'hostel']

class GuardianViewSet(viewsets.ModelViewSet):
    serializer_class = GuardianSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'PARENT':
            return Guardian.objects.filter(student__parent_relationships__parent=user).distinct()
        return Guardian.objects.all()

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.role == 'PARENT':
            from .models import StudentParentRelationship
            # Get all students linked to this parent
            linked_students = StudentParentRelationship.objects.filter(parent=user).values_list('student', flat=True)
            
            if not linked_students:
                return Response({"error": "No students linked to this parent."}, status=status.HTTP_400_BAD_REQUEST)

            created_guardians = []
            errors = []
            
            from django.db import transaction
            
            with transaction.atomic():
                for student_id in linked_students:
                    data = request.data.copy()
                    data['student'] = student_id
                    
                    serializer = self.get_serializer(data=data)
                    if serializer.is_valid():
                        serializer.save(added_by=user)
                        created_guardians.append(serializer.data)
                    else:
                        # If duplicate or invalid for one student, we might want to skip or fail?
                        # Capturing error but continuing or failing depends on requirement.
                        # For now, let's fail if any is invalid (e.g. invalid phone format)
                        # excluding unique constraint per student?
                        # Uniqueness is (student, phone).
                        # If already exists for one student, we should probably skip that one or update?
                        # Prompt implied "add for all".
                        # If it fails due to uniqueness, we can ignore that specific student.
                        if 'non_field_errors' in serializer.errors:
                             # Likely unique constraint
                             continue
                        errors.append(serializer.errors)
            
            if errors and not created_guardians:
                 return Response(errors, status=status.HTTP_400_BAD_REQUEST)
                 
            return Response(created_guardians, status=status.HTTP_201_CREATED)

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        # Admin only
        if request.user.role != 'ADMIN':
             return Response({"error": "Admin only"}, status=status.HTTP_403_FORBIDDEN)
        
        guardian = self.get_object()
        guardian.is_approved = True
        guardian.approved_by = request.user
        guardian.approved_date = timezone.now()
        guardian.rejection_reason = "" # Clear previous rejection if any
        guardian.save()
        return Response({'status': 'guardian approved'})

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        # Admin only
        if request.user.role != 'ADMIN':
             return Response({"error": "Admin only"}, status=status.HTTP_403_FORBIDDEN)
        
        reason = request.data.get('reason', 'No reason provided')
        guardian = self.get_object()
        guardian.is_approved = False
        guardian.rejection_reason = reason
        guardian.approved_by = None
        guardian.approved_date = None
        guardian.save()
        return Response({'status': 'guardian rejected'})

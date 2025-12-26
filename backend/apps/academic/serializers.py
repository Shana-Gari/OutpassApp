from rest_framework import serializers
from .models import AcademicYear, Class, Section

class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = '__all__'

class ClassSerializer(serializers.ModelSerializer):
    code = serializers.CharField(required=False)

    class Meta:
        model = Class
        fields = '__all__'

    def validate(self, data):
        if 'code' not in data or not data['code']:
            data['code'] = data['name'].upper().replace(" ", "_")
        return data

class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = '__all__'

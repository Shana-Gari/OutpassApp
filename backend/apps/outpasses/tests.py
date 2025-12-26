from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.outpasses.models import Outpass

User = get_user_model()

class DashboardStatsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='admin', password='password', role='ADMIN')
        self.client.force_authenticate(user=self.user)

    def test_stats_endpoint(self):
        response = self.client.get('/api/outpasses/stats/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('total_students', response.data)
        self.assertIn('active_outpasses', response.data)
        self.assertIn('trends', response.data)
        print("Stats Endpoint Response Keys:", response.data.keys())

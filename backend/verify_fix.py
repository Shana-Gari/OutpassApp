import requests
import json

BASE_URL = 'http://127.0.0.1:8000/api'

def verify_accountant_view():
    # 1. Login as Accountant (assuming a test accountant exists or we use the one from previous context)
    # I'll try a known test user or create a quick one if needed, but for now let's try a standard one.
    # Actually, I'll rely on the existing tokens or just print the response structure if I can.
    # A better approach is to use the python shell to inspect the serializer directly without network calls.
    
    import os
    import django
    import sys
    
    sys.path.append('c:\\Users\\Shana\\Desktop\\OutpassApp\\backend')
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
    django.setup()
    
    from apps.outpasses.serializers import DashboardOutpassSerializer
    from apps.outpasses.models import Outpass
    from apps.users.models import User
    
    print("Checking DashboardOutpassSerializer fields...")
    serializer_fields = DashboardOutpassSerializer().fields.keys()
    
    if 'fee_paid' in serializer_fields and 'fee_paid_at' in serializer_fields:
        print("SUCCESS: fee_paid and fee_paid_at are present in the serializer.")
    else:
        print(f"FAILURE: Missing fields. Current fields: {list(serializer_fields)}")

if __name__ == '__main__':
    verify_accountant_view()

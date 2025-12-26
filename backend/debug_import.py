import sys
import os
import traceback
import django

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'outpass_system.settings')
django.setup()

try:
    print("Attempting to import apps.outpasses.serializers...")
    import apps.outpasses.serializers
    print("Import SUCCESS")
except Exception:
    with open('error_trace.txt', 'w') as f:
        traceback.print_exc(file=f)
    print("Traceback written to error_trace.txt")

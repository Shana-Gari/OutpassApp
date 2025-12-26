# Outpass Management System

This project consists of three main components:
1. **Backend**: Django REST Framework API
2. **Mobile App**: Expo (React Native) for Parents & Staff
3. **Admin Portal**: React Web Dashboard

## Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL (optional, defaults to SQLite for dev)

## 1. Backend Setup (Django)
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/Mac
# source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

## 2. Mobile App Setup (Expo)
```bash
cd mobile
npm install
npx expo start
```
- Scan the QR code with Expo Go app on your phone.
- Ensure your phone is on the same network as your PC.
- Update `constants/config.ts` with your PC's IP address.

## 3. Admin Portal Setup (React)
```bash
cd admin-portal
npm install
npm run dev
```
- Open http://localhost:5173 to view the admin dashboard.

## Default Credentials (Dev)
- **Mobile Login**:
  - Enter any phone number.
  - OTP will be printed in the backend console (Mock service).
- **Admin Login**:
  - Click "Login as Admin" (Bypassed for prototype).

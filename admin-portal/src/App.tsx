
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardLayout from './layouts/DashboardLayout';
import StaffDashboard from './pages/dashboard/StaffDashboard';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient();

import Login from './pages/Login';

import Parents from './pages/Parents';
import Classes from './pages/Classes';

import Staff from './pages/Staff';

import Students from './pages/Students';
import Guardians from './pages/Guardians';

import Housing from './pages/Housing';

// HM Imports
import HMPriority from './pages/dashboard/hm/Priority';
import HMHistory from './pages/dashboard/hm/History';
import HMAnalytics from './pages/dashboard/hm/Analytics';
import Profile from './pages/Profile';

export default function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />

          <Route element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" />}>
            <Route path="/" element={<StaffDashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/parents" element={<Parents />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/guardians" element={<Guardians />} />
            <Route path="/housing" element={<Housing />} />

            {/* HM Specific Routes */}
            <Route path="/hm/priority" element={<HMPriority />} />
            <Route path="/hm/history" element={<HMHistory />} />
            <Route path="/hm/analytics" element={<HMAnalytics />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

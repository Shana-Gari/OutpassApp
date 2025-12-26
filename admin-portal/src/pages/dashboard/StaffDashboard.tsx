import React from 'react';
import { useAuthStore } from '../../store/authStore';
import AccountantDashboard from './AccountantDashboard';
import HMDashboard from './HMDashboard';
import WardenDashboard from './WardenDashboard';
import GateStaffDashboard from './GateStaffDashboard';
import Dashboard from '../Dashboard'; // Regular Admin Dashboard

const StaffDashboard = () => {
    const { role } = useAuthStore();

    if (role === 'ACCOUNTANT') {
        return <AccountantDashboard />;
    }
    if (role === 'HM') {
        return <HMDashboard />;
    }
    if (role === 'WARDEN') {
        return <WardenDashboard />;
    }
    if (role === 'GATE_STAFF') {
        return <GateStaffDashboard />;
    }

    // Default fallback or Admin Dashboard
    // If role is ADMIN, they might want the main Dashboard
    return <Dashboard />;
};

export default StaffDashboard;

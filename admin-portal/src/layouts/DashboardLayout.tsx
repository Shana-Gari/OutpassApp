
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, GraduationCap, Building2, LogOut, AlertTriangle, Clock, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function DashboardLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { role, logout } = useAuthStore();

    const navItems = [
        { path: '/', label: 'Overview', icon: LayoutDashboard },
        { path: '/students', label: 'Students', icon: GraduationCap },
        { path: '/staff', label: 'Staff', icon: Users },
        { path: '/parents', label: 'Parents', icon: Users },
        { path: '/guardians', label: 'Guardian Verification', icon: Users },
        { path: '/classes', label: 'Classes', icon: Building2 },
        { path: '/housing', label: 'Housing', icon: Building2 },
        { path: '/profile', label: 'My Profile', icon: Users },
    ];

    // Filter nav items based on HM role to prioritize their pages
    const filteredNavItems = role === 'HM'
        ? [
            { path: '/', label: 'HM Dashboard', icon: LayoutDashboard },
            { path: '/hm/priority', label: 'Priority Alerts', icon: AlertTriangle },
            { path: '/hm/history', label: 'Outpass History', icon: Clock },
            { path: '/hm/analytics', label: 'Reports & Analytics', icon: BarChart3 },
            ...navItems.slice(1, -1), // Other admin tools if they have access
            { path: '/profile', label: 'My Profile', icon: Users },
        ]
        : navItems;

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-md flex flex-col">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-blue-600">Outpass Admin</h1>
                    <p className="text-xs text-gray-400 mt-1">{role} Portal</p>
                </div>
                <nav className="mt-6 flex-1">
                    {filteredNavItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 ${location.pathname === item.path ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                                }`}
                        >
                            {item.icon && <item.icon size={20} className="mr-3" />}
                            {item.label}
                        </Link>
                    ))}
                    <button
                        onClick={() => {
                            logout();
                            navigate('/login');
                        }}
                        className="flex items-center px-6 py-3 w-full text-left text-red-600 hover:bg-red-50 mt-4"
                    >
                        <LogOut size={20} className="mr-3" />
                        Logout
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto flex flex-col">
                <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {filteredNavItems.find(n => n.path === location.pathname)?.label || 'Dashboard'}
                    </h2>
                    <Link to="/profile" className="flex items-center space-x-4 hover:bg-gray-50 p-2 rounded transition-colors">
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">User Profile</p>
                            <p className="text-xs text-gray-500">{role}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {role?.[0]}
                        </div>
                    </Link>
                </header>
                <main className="p-8 flex-1">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

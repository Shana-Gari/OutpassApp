import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    School,
    LogOut,
    Settings,
    FileText,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    ShieldAlert,
    CalendarDays,
    Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
    const toggleCollapse = () => setCollapsed(!collapsed);
    const toggleMobile = () => setMobileOpen(!mobileOpen);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
        { icon: Users, label: 'User Management', to: '/users' },
        { icon: School, label: 'Academic Setup', to: '/academic' },
        { icon: Home, label: 'Housing', to: '/housing' },
        { icon: FileText, label: 'Outpass', to: '/outpass' },
        { icon: CalendarDays, label: 'Holidays', to: '/holidays' },
        { icon: Settings, label: 'Configuration', to: '/settings' },
        { icon: ShieldAlert, label: 'Tools', to: '/tools' },
    ];

    return (
        <>
            {/* Mobile Menu Button - Visible only on small screens */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button onClick={toggleMobile} className="p-2 bg-white rounded-md shadow-md text-slate-700">
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 bg-slate-900 text-white transition-all duration-300 ease-in-out shadow-xl",
                    collapsed ? "w-20" : "w-64",
                    mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo Area */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
                        {!collapsed && <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Outpass Admin</span>}
                        {collapsed && <span className="text-xl font-bold mx-auto text-blue-500">OA</span>}
                        <button onClick={toggleCollapse} className="hidden lg:block text-slate-400 hover:text-white transition-colors">
                            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 py-6 px-2 space-y-1 overflow-y-auto custom-scrollbar">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.label}
                                to={item.to}
                                onClick={() => setMobileOpen(false)} // Close mobile menu on click
                                className={({ isActive }) => cn(
                                    "flex items-center px-4 py-3 rounded-lg transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <item.icon size={22} className={cn("min-w-[22px]", collapsed ? "mx-auto" : "mr-3")} />
                                {!collapsed && <span className="font-medium truncate">{item.label}</span>}

                                {/* Tooltip for collapsed state */}
                                {collapsed && (
                                    <div className="absolute left-16 ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-md border border-slate-700">
                                        {item.label}
                                    </div>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* User Profile / Logout */}
                    <div className="p-4 border-t border-slate-800">
                        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
                            {!collapsed && (
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold shadow-md">
                                        AD
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">Admin User</span>
                                        <span className="text-xs text-slate-500 truncate max-w-[120px]">admin@school.edu</span>
                                    </div>
                                </div>
                            )}
                            <button className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-md hover:bg-slate-800" title="Logout">
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />
            )}
        </>
    );
}

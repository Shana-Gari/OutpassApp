import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Bell } from 'lucide-react';

export function MainLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar
                collapsed={sidebarCollapsed}
                setCollapsed={setSidebarCollapsed}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            {/* Main Content Area */}
            <main
                className={cn(
                    "flex-1 transition-all duration-300 ease-in-out min-h-screen flex flex-col",
                    sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
                )}
            >
                {/* Topbar */}
                <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-8 flex items-center justify-between shadow-sm">
                    <div className="lg:hidden">
                        {/* Spacer for mobile menu button */}
                        <div className="w-8"></div>
                    </div>

                    <div className="flex items-center space-x-4 ml-auto">
                        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-2"></div>
                        <span className="text-sm font-medium text-slate-700 hidden sm:inline-block">Academic Year: 2024-25</span>
                    </div>
                </header>

                {/* Content */}
                <div className="p-6 md:p-8 flex-1 overflow-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    LogOut,
    BarChart3,
    FileText,
    Loader2,
    Shield,
    Activity,
    Settings,
    Ticket,
    Target,
    BookOpen
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/features/notifications/NotificationBell';
import { useEffect } from 'react';

const menuItems = [
    {
        href: '/admin',
        label: 'Home',
        icon: LayoutDashboard,
    },
    {
        href: '/admin/organization',
        label: 'Team',
        icon: Shield,
    },
    {
        href: '/admin/operations',
        label: 'Tasks',
        icon: FileText,
    },
    {
        href: '/admin/okr',
        label: 'OKRs',
        icon: Target,
    },
    {
        href: '/admin/learning-hub',
        label: 'Academy',
        icon: BookOpen,
    },
    {
        href: '/admin/performance',
        label: 'Score',
        icon: BarChart3,
    },
    {
        href: '/admin/helpdesk',
        label: 'Box',
        icon: Ticket,
    },
    {
        href: '/admin/activity-log',
        label: 'Logs',
        icon: Activity,
    },
    {
        href: '/admin/system',
        label: 'Settings',
        icon: Settings,
    },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading, logout } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fcfdfe]">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse shadow-2xl shadow-indigo-200/50" />
                        <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-white" />
                    </div>
                    <p className="text-slate-400 text-xs font-black tracking-[0.2em] uppercase">Initializing</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen flex flex-col bg-[#fcfdfe]">
            {/* Top Brand Bar */}
            <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-4">
                <div className="max-w-[1700px] mx-auto">
                    <div className="glass-panel px-6 py-3 flex items-center justify-between border-slate-200/60 shadow-xl shadow-slate-100/50">
                        {/* Brand */}
                        <div className="flex items-center gap-10">
                            <Link href="/admin" className="flex items-center group">
                                <div className="p-2.5 rounded-2xl bg-slate-900 group-hover:bg-indigo-600 transition-all duration-500 shadow-xl shadow-slate-200">
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                                <div className="ml-4 flex flex-col">
                                    <span className="text-lg font-black tracking-tight text-slate-900 leading-none">
                                        JewelMatrix
                                    </span>
                                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">
                                        Executive Command
                                    </span>
                                </div>
                            </Link>

                            {/* Desktop Menu (2xl and above) */}
                            <div className="hidden 2xl:flex items-center gap-2 bg-slate-100/60 p-1.5 rounded-2xl border border-slate-200/60">
                                {menuItems.map((item) => {
                                    const isActive = item.href === '/admin'
                                        ? pathname === '/admin'
                                        : pathname === item.href || pathname.startsWith(item.href + '/');
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                                                isActive
                                                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                                                    : "text-slate-500 hover:text-indigo-600 hover:bg-white/50"
                                            )}
                                        >
                                            <item.icon className={cn("h-4 w-4", isActive ? "text-indigo-600" : "text-slate-400")} />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-4">
                            <NotificationBell />
                            <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block" />
                            <Button
                                variant="ghost"
                                onClick={handleLogout}
                                className="group h-11 w-11 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                            >
                                <LogOut className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile/Tablet Secondary Menu Bar (Visible below 2xl) */}
            <div className="2xl:hidden fixed top-[100px] left-0 right-0 z-[90] px-6">
                <div className="glass-panel overflow-x-auto p-2 scrollbar-none border-slate-200/60 shadow-lg shadow-slate-100/30">
                    <div className="flex items-center gap-2 whitespace-nowrap min-w-max px-2">
                        {menuItems.map((item) => {
                            const isActive = item.href === '/admin'
                                ? pathname === '/admin'
                                : pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                        isActive
                                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                    )}
                                >
                                    <item.icon className={cn("h-3.5 w-3.5", isActive ? "text-white" : "text-slate-400")} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 pt-44 2xl:pt-36 pb-20">
                <div className="admin-container animate-in">
                    {children}
                </div>
            </main>
        </div>
    );
}


// End of file

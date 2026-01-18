"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    LogOut,
    Home,
    BarChart3,
    FileText,
    Server,
    Loader2,
    Shield,
    Activity
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const menuItems = [
    {
        href: '/admin',
        label: 'Home',
        icon: LayoutDashboard,
    },
    {
        href: '/admin/organization',
        label: 'People & Teams',
        icon: Shield,
    },
    {
        href: '/admin/operations',
        label: 'Tasks & Goals',
        icon: FileText,
    },
    {
        href: '/admin/performance',
        label: 'Reports',
        icon: BarChart3,
    },
    {
        href: '/admin/activity-log',
        label: 'Activity Log',
        icon: Activity,
    },
    {
        href: '/admin/system',
        label: 'Settings',
        icon: Server,
    },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading, signOut } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    const handleLogout = async () => {
        try {
            await signOut();
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className="admin-root flex-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 animate-pulse" />
                        <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-white" />
                    </div>
                    <p className="text-slate-400 text-xs font-medium tracking-wide">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect if not authenticated
    if (!user) {
        return (
            <div className="admin-root flex-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 animate-pulse" />
                        <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-white" />
                    </div>
                    <p className="text-slate-400 text-xs font-medium tracking-wide">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    // Get user display name and initials
    const displayName = user.displayName || user.email?.split('@')[0] || 'Admin';
    const initials = displayName.charAt(0).toUpperCase();

    return (
        <div className="admin-root">
            {/* Simplified Top Navigation Bar */}
            <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link href="/admin" className="flex items-center">
                                <img
                                    src="/logo.png"
                                    alt="SunSeaJwellers Logo"
                                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                                />
                            </Link>
                        </div>
                        <h1 className="hidden sm:block absolute left-1/2 transform -translate-x-1/2 text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider">
                            Admin Dashboard
                        </h1>
                        <h1 className="sm:hidden text-xs font-black text-slate-900 uppercase tracking-wider flex-1 text-center">
                            Admin
                        </h1>
                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="flex text-slate-500 hover:text-red-500 hover:bg-red-50 gap-2 px-3 sm:px-4 py-2 sm:py-2.5 h-auto text-xs sm:text-sm font-semibold rounded-xl"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                        </Button>
                    </div>

                    {/* Centered Menu */}
                    <div className="mt-3 flex justify-center overflow-x-auto">
                        <div className="flex gap-1 min-w-max">
                            {menuItems.map((item) => {
                                const isActive = item.href === '/admin'
                                    ? pathname === '/admin'
                                    : pathname === item.href || pathname.startsWith(item.href + '/');
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap",
                                            isActive
                                                ? "text-indigo-600 border-b-2 border-indigo-600"
                                                : "text-slate-600 hover:text-slate-900"
                                        )}
                                    >
                                        <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content - Fixed Height */}
            <main className="admin-content">
                {children}
            </main>
        </div>
    );
}

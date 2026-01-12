"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    LogOut,
    Home,
    Users,
    BarChart3,
    FileText,
    Award,
    Server,
    Bell,
    Users2,
    Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const menuItems = [
    {
        href: '/admin',
        label: 'Dashboard',
        icon: LayoutDashboard,
    },
    {
        href: '/admin/users',
        label: 'Users',
        icon: Users,
    },
    {
        href: '/admin/teams',
        label: 'Teams',
        icon: Users2,
    },
    {
        href: '/admin/team-hub',
        label: 'Team Hub',
        icon: Users,
    },
    {
        href: '/admin/analytics',
        label: 'Analytics',
        icon: BarChart3,
    },
    {
        href: '/admin/reports',
        label: 'Reports',
        icon: FileText,
    },
    {
        href: '/admin/scoring',
        label: 'Scoring',
        icon: Award,
    },
    {
        href: '/admin/notifications',
        label: 'Notifications',
        icon: Bell,
    },
    {
        href: '/admin/system',
        label: 'System',
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
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    <p className="text-slate-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect if not authenticated
    if (!user) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    <p className="text-slate-500 text-sm">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    // Get user display name and initials
    const displayName = user.displayName || user.email?.split('@')[0] || 'Admin';
    const initials = displayName.charAt(0).toUpperCase();

    return (
        <div className="min-h-screen bg-white">
            {/* Top Navigation Bar */}
            <nav className="relative top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
                <div className="px-4 lg:px-6">
                    <div className="flex h-14 items-center gap-1">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            <Link href="/admin" className="flex items-center">
                                <img
                                    src="/logo.png"
                                    alt="SunSeaJwellers Logo"
                                    className="h-24 w-auto -my-5"
                                />
                            </Link>
                        </div>

                        {/* Separator */}
                        <div className="hidden lg:block h-5 w-px bg-slate-200 mx-2"></div>

                        {/* Desktop Navigation - All Items Distributed */}
                        <div className="hidden lg:flex items-center gap-1 flex-1 justify-between w-full">
                            {menuItems.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                                            isActive
                                                ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/20"
                                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}

                            {/* Separator */}
                            <div className="h-5 w-px bg-slate-200 mx-2"></div>

                            {/* View Site */}
                            <a
                                href="#"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all whitespace-nowrap"
                            >
                                <Home className="h-4 w-4" />
                                <span>View Site</span>
                            </a>

                            {/* Logout Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="flex text-slate-600 hover:text-red-500 hover:bg-red-50 gap-1.5 px-3 py-1.5 h-auto text-sm font-medium"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Logout</span>
                            </Button>

                            {/* User Avatar */}
                            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-slate-100 ml-1">
                                <Avatar className="h-7 w-7 border border-purple-300">
                                    <AvatarImage src={user.photoURL || ''} alt={displayName} />
                                    <AvatarFallback className="bg-purple-100 text-purple-700 text-xs font-bold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-slate-900 font-medium">{displayName}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="min-h-[calc(100vh-4rem)]">
                {children}
            </main>
        </div>
    );
}

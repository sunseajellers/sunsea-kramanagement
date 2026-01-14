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
    Shield
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
            {/* Top Navigation Bar - Taller Header */}
            <nav className="admin-header">
                <div className="h-full px-4 lg:px-6">
                    <div className="flex h-full items-center gap-2">
                        {/* Logo - Properly sized */}
                        <div className="flex-shrink-0">
                            <Link href="/admin" className="flex items-center">
                                <img
                                    src="/logo.png"
                                    alt="SunSeaJwellers Logo"
                                    className="h-14 w-auto object-contain"
                                />
                            </Link>
                        </div>

                        {/* Separator */}
                        <div className="hidden lg:block h-8 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent mx-3" />

                        {/* Desktop Navigation - All Items Distributed */}
                        <div className="hidden lg:flex items-center gap-1 flex-1">
                            {menuItems.map((item) => {
                                // Special handling for dashboard - only exact match
                                const isActive = item.href === '/admin'
                                    ? pathname === '/admin'
                                    : pathname === item.href || pathname.startsWith(item.href + '/');
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                                            isActive
                                                ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/20"
                                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/80"
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Right Section */}
                        <div className="hidden lg:flex items-center gap-2 ml-auto">
                            {/* Separator */}
                            <div className="h-8 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent mx-2" />

                            {/* View Site */}
                            <a
                                href="#"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-all whitespace-nowrap"
                            >
                                <Home className="h-4 w-4" />
                                <span>View Site</span>
                            </a>

                            {/* Logout Button */}
                            <Button
                                variant="ghost"
                                onClick={handleLogout}
                                className="flex text-slate-500 hover:text-red-500 hover:bg-red-50 gap-2 px-4 py-2.5 h-auto text-sm font-semibold rounded-xl"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Logout</span>
                            </Button>

                            {/* User Avatar with Glassmorphism */}
                            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200/50 ml-1">
                                <Avatar className="h-8 w-8 border-2 border-purple-200 shadow-sm">
                                    <AvatarImage src={user.photoURL || ''} alt={displayName} />
                                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white text-xs font-bold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-sm text-slate-900 font-semibold leading-tight">{displayName}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Administrator</span>
                                </div>
                            </div>
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

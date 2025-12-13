// src/app/dashboard/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldAlert, BarChart3, Users, Bell, Settings, UserCheck } from 'lucide-react';

const adminNavItems = [
    { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/admin/users', label: 'Users', icon: UserCheck },
    { href: '/dashboard/admin/teams', label: 'Teams', icon: Users },
    { href: '/dashboard/admin/notifications', label: 'Notifications', icon: Bell },
    { href: '/dashboard/admin/scoring', label: 'Scoring', icon: Settings },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, userData, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (loading) return;

        // Not logged in - redirect to login
        if (!user) {
            router.replace('/');
            return;
        }

        // Not admin - redirect to dashboard
        if (!userData?.isAdmin) {
            router.replace('/dashboard');
            return;
        }

        // User is admin
        setChecking(false);
    }, [user, userData, loading, router]);

    // Show loading state
    if (loading || checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    // Show access denied if not admin (shouldn't reach here due to redirect, but just in case)
    if (!userData?.isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                    <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-6">
                        You don't have permission to access the admin panel.
                        Only administrators can access this area.
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="btn-primary"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Admin Navigation */}
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 flex items-center">
                                <ShieldAlert className="h-8 w-8 text-primary-600" />
                                <span className="ml-2 text-xl font-bold text-gray-900">Admin Panel</span>
                            </div>
                        </div>
                        <div className="flex space-x-8">
                            {adminNavItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                                            isActive
                                                ? 'border-primary-500 text-gray-900'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        }`}
                                    >
                                        <item.icon className="h-4 w-4 mr-2" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                        <div className="flex items-center">
                            <Link
                                href="/dashboard"
                                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                            >
                                ← Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}

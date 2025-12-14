// src/app/dashboard/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { Loader2, ShieldAlert } from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, userData, loading } = useAuth();
    const router = useRouter();
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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Admin Header */}
            <AdminHeader />

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
}

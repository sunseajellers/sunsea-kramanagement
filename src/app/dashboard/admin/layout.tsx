// src/app/dashboard/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { userHasPermission } from '@/lib/rbacService';
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

        // Check admin permission
        const checkAdminAccess = async () => {
            if (userData?.uid) {
                try {
                    const hasAccess = await userHasPermission(userData.uid, 'admin', 'access');
                    if (!hasAccess) {
                        router.replace('/dashboard');
                        return;
                    }
                } catch (error) {
                    console.error('Error checking admin permission:', error);
                    router.replace('/dashboard');
                    return;
                }
            }
            // User has admin access
            setChecking(false);
        };

        checkAdminAccess();
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

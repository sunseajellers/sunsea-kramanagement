'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import ActivityLogViewer from '@/components/features/activity/ActivityLogViewer';
import AdminLayout from '@/components/AdminLayout';

export default function ActivityLogPage() {
    const { isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-black text-slate-900 mb-2">Access Denied</h1>
                    <p className="text-slate-600 mb-6">You don't have permission to view activity logs.</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent tracking-tight">
                        System Activity Log
                    </h1>
                    <p className="text-slate-600 mt-2">Monitor all user activities and system events across the platform</p>
                </div>

                {/* Activity Log with full features */}
                <ActivityLogViewer
                    limit={100}
                    showFilters={true}
                    maxHeight="max-h-screen"
                    compact={false}
                />
            </div>
        </AdminLayout>
    );
}

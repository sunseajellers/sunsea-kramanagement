'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import ActivityLogViewer from '@/components/features/activity/ActivityLogViewer';

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
        <div className="space-y-10">
            {/* Header */}
            <div className="page-header">
                <h1 className="section-title">Operations Ledger</h1>
                <p className="section-subtitle">Real-time audit trail of system-wide tactical events and user interactions</p>
            </div>

            {/* Activity Log with full features */}
            <div className="glass-panel p-1">
                <ActivityLogViewer
                    limit={100}
                    showFilters={true}
                    maxHeight="calc(100vh - 400px)"
                    compact={false}
                />
            </div>
        </div>
    );
}

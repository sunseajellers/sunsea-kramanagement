// src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDatabaseStats } from '@/lib/adminService';
import {
    Users,
    Shield,
    AlertTriangle,
    Zap,
    CheckCircle2,
    Target,
    Activity,
    Loader2,
    ArrowRight,
    TrendingUp,
    Clock,
    BarChart3,
    Calendar,
    FileText,
    TrendingDown,
    CircleAlert
} from 'lucide-react';
import Link from 'next/link';
import AdminVerificationQueue from '@/components/admin/AdminVerificationQueue';
import { Button } from '@/components/ui/button';

interface DbStats {
    users: number;
    teams: number;
    tasks: number;
    kras: number;
    reports: number;
}

export default function AdminHome() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const [dbStats, setDbStats] = useState<DbStats | null>(null);
    const [allTasks, setAllTasks] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && user && isAdmin) {
            loadDashboardData();
        } else if (!authLoading && (!user || !isAdmin)) {
            setLoading(false);
        }
    }, [authLoading, user, isAdmin]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const { getAllTasks } = await import('@/lib/taskService');

            const [statsData, tasksData] = await Promise.all([
                getDatabaseStats(),
                getAllTasks(200)
            ]);

            setDbStats(statsData);
            setAllTasks(tasksData);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            setError('Failed to load dashboard data. Check your admin permissions.');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse shadow-lg">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                <div className="max-w-md w-full text-center p-8 bg-white rounded-3xl shadow-xl border border-slate-200">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-50 flex items-center justify-center">
                        <AlertTriangle className="h-10 w-10 text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
                    <p className="text-slate-600 mb-6">
                        You need admin rights to access this area.
                    </p>
                    <div className="text-xs text-slate-400 font-mono bg-slate-50 rounded-lg px-4 py-3">
                        ID: {user?.uid?.slice(0, 16)}...
                    </div>
                </div>
            </div>
        );
    }

    const pendingTasks = allTasks.filter(t => t.status === 'pending_review').length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
    const taskCompletionRate = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Welcome Section */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                    </div>
                    <Button 
                        onClick={loadDashboardData} 
                        variant="outline"
                        className="border-gray-300"
                    >
                        <Activity className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
                    <AlertTriangle className="h-5 w-5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Primary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-5 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                        <Users className="h-5 w-5 text-gray-600" />
                        <p className="text-sm text-gray-600">Team Members</p>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900">{dbStats?.users || 0}</h3>
                </div>

                <div className="bg-white rounded-lg p-5 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                        <Shield className="h-5 w-5 text-gray-600" />
                        <p className="text-sm text-gray-600">Active Teams</p>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900">{dbStats?.teams || 0}</h3>
                </div>

                <div className="bg-white rounded-lg p-5 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                        <CheckCircle2 className="h-5 w-5 text-gray-600" />
                        <p className="text-sm text-gray-600">Total Tasks</p>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900">{dbStats?.tasks || 0}</h3>
                </div>

                <div className="bg-white rounded-lg p-5 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                        <Target className="h-5 w-5 text-gray-600" />
                        <p className="text-sm text-gray-600">KRAs Set</p>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900">{dbStats?.kras || 0}</h3>
                </div>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-5 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-600">Completed</p>
                        <p className="text-xl font-semibold text-gray-900">{completedTasks}</p>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-900" style={{ width: `${taskCompletionRate}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{taskCompletionRate}% rate</p>
                </div>

                <div className="bg-white rounded-lg p-5 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-600">In Progress</p>
                        <p className="text-xl font-semibold text-gray-900">{inProgressTasks}</p>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-900" style={{ width: `${allTasks.length > 0 ? (inProgressTasks / allTasks.length) * 100 : 0}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Active items</p>
                </div>

                <div className="bg-white rounded-lg p-5 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-600">Pending Review</p>
                        <p className="text-xl font-semibold text-gray-900">{pendingTasks}</p>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-900" style={{ width: `${allTasks.length > 0 ? (pendingTasks / allTasks.length) * 100 : 0}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Needs approval</p>
                </div>
            </div>

            {/* Pending Approvals */}
            {pendingTasks > 0 && (
                <div className="bg-white rounded-lg p-5 border border-gray-200">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
                        <p className="text-sm text-gray-500 mt-1">{pendingTasks} task{pendingTasks > 1 ? 's' : ''} waiting</p>
                    </div>
                    <AdminVerificationQueue 
                        tasks={allTasks} 
                        onVerificationComplete={loadDashboardData} 
                    />
                </div>
            )}
        </div>
    );
}

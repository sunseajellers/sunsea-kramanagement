// src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSystemHealth, getDatabaseStats } from '@/lib/adminService';
import { authenticatedJsonFetch } from '@/lib/apiClient'
import { Users, BarChart3, Award, Activity, Database, Shield, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { TaskStatusChart, TaskPriorityChart } from '@/components/features/analytics'
import AdminVerificationQueue from '@/components/admin/AdminVerificationQueue';



interface DbStats {
    users: number;
    teams: number;
    tasks: number;
    kras: number;
    reports: number;
}

export default function AdminHome() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    // const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
    const [dbStats, setDbStats] = useState<DbStats | null>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [allTasks, setAllTasks] = useState<any[]>([]);
    const [, setDataLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Only fetch data when auth is ready and user is admin
        if (!authLoading && user && isAdmin) {
            loadDashboardData();
        }
    }, [authLoading, user, isAdmin]);

    const loadDashboardData = async () => {
        try {
            setDataLoading(true);
            setError(null);

            // Dynamic import to avoid server/client conflicts if any
            const { getAllTasks } = await import('@/lib/taskService');

            const [, statsData, analyticsResult, tasksData] = await Promise.all([
                getSystemHealth(),
                getDatabaseStats(),
                authenticatedJsonFetch('/api/analytics', {
                    headers: {
                        'x-user-id': user?.uid || ''
                    }
                }),
                getAllTasks(200)
            ]);

            // setSystemHealth(healthData);
            setDbStats(statsData);
            setAllTasks(tasksData);

            if (analyticsResult.success && analyticsResult.data) {
                setAnalytics(analyticsResult.data);
            } else {
                console.warn('Analytics fetch returned:', analyticsResult.error);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            setError('Failed to load some dashboard data. Check your admin permissions.');
        } finally {
            setDataLoading(false);
        }
    };

    // Show loading state while auth is initializing
    if (authLoading) {
        return (
            <div className="page-container flex-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center animate-pulse">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Show message if user is not admin
    if (!isAdmin) {
        return (
            <div className="page-container flex-center">
                <div className="max-w-md text-center p-8 glass-card">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-amber-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
                    <p className="text-gray-500 text-sm mb-4">
                        Your account doesn&apos;t have admin privileges. Please contact the system administrator to get access.
                    </p>
                    <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded-lg px-3 py-2">
                        User ID: {user?.uid?.slice(0, 12)}...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Page Header - Compact */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">System Overview</h1>
                    <p className="text-gray-400 text-xs font-medium flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Live platform monitoring & management
                    </p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Main Grid - Fills Remaining Space */}
            <div className="page-grid" style={{ gridTemplateRows: 'auto 1fr', gridTemplateColumns: '1fr 320px' }}>
                {/* ... */}

                {/* Top Stats Row - Spans Full Width */}
                <div className="col-span-2 grid grid-cols-4 gap-4">
                    {[
                        { label: 'Total Users', value: dbStats?.users || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%', trendUp: true },
                        { label: 'Active Teams', value: dbStats?.teams || 0, icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: 'Stable', trendUp: null },
                        { label: 'Active Tasks', value: dbStats?.tasks || 0, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+5%', trendUp: true },
                        { label: 'Cloud Health', value: '99.9%', icon: Database, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Optimal', trendUp: true }
                    ].map((stat, i) => (
                        <div key={i} className="stat-card group">
                            <div className="flex flex-col gap-1">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{stat.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                                    <span className={`text-[10px] font-semibold ${stat.trendUp === true ? 'text-green-500' : stat.trendUp === false ? 'text-red-500' : 'text-gray-400'}`}>
                                        {stat.trend}
                                    </span>
                                </div>
                            </div>
                            <div className={`icon-box icon-box-md ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Verification Queue (Phase 5) */}
                <div className="col-span-2">
                    <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-sm">
                        <AdminVerificationQueue
                            tasks={allTasks}
                            onVerificationComplete={loadDashboardData}
                        />
                    </div>
                </div>

                {/* Left Column - Metrics & Data */}
                <div className="flex flex-col gap-4 min-h-0">
                    {/* Task Summary */}
                    <div className="glass-card p-4">
                        <h3 className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Task Summary
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 bg-blue-50 rounded-xl">
                                <p className="text-2xl font-bold text-blue-600">{analytics?.overview?.totalTasks || 0}</p>
                                <p className="text-[10px] text-gray-500 font-medium">Total</p>
                            </div>
                            <div className="text-center p-3 bg-amber-50 rounded-xl">
                                <p className="text-2xl font-bold text-amber-600">{analytics?.overview?.inProgressTasks || 0}</p>
                                <p className="text-[10px] text-gray-500 font-medium">In Progress</p>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-xl">
                                <p className="text-2xl font-bold text-green-600">{analytics?.overview?.completedTasks || 0}</p>
                                <p className="text-[10px] text-gray-500 font-medium">Completed</p>
                            </div>
                        </div>
                    </div>

                    {/* Completion Rate */}
                    <div className="glass-card p-4">
                        <h3 className="text-xs font-semibold text-gray-500 mb-3">Overall Completion Rate</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full transition-all"
                                        style={{ width: `${analytics?.overview?.overallCompletionRate || 0}%` }}
                                    />
                                </div>
                            </div>
                            <span className="text-xl font-bold text-gray-900">{analytics?.overview?.overallCompletionRate || 0}%</span>
                        </div>
                    </div>

                    {/* Database Overview */}
                    <div className="glass-card p-4 flex-1">
                        <h3 className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            Database Records
                        </h3>
                        <div className="space-y-2">
                            {[
                                { label: 'Users', count: dbStats?.users || 0, color: 'bg-blue-500' },
                                { label: 'Teams', count: dbStats?.teams || 0, color: 'bg-indigo-500' },
                                { label: 'Tasks', count: dbStats?.tasks || 0, color: 'bg-emerald-500' },
                                { label: 'KRAs', count: dbStats?.kras || 0, color: 'bg-amber-500' },
                                { label: 'Reports', count: dbStats?.reports || 0, color: 'bg-rose-500' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${item.color}`} />
                                        <span className="text-xs font-medium text-gray-600">{item.label}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - Live Insights */}
                <div className="flex flex-col gap-4 min-h-0">
                    <h2 className="text-sm font-semibold text-gray-700">Live Insights</h2>
                    <div className="flex-1 flex flex-col gap-3 scroll-panel pr-1">
                        {/* Task Distribution Chart */}
                        <div className="glass-card p-4 flex-1 min-h-0">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-semibold text-gray-500">Task Distribution</h3>
                                <Zap className="h-3.5 w-3.5 text-blue-500" />
                            </div>
                            <div className="h-[calc(100%-28px)]">
                                {analytics ? (
                                    <TaskStatusChart data={{
                                        pending: analytics.overview?.totalTasks - analytics.overview?.completedTasks - analytics.overview?.inProgressTasks || 0,
                                        'in-progress': analytics.overview?.inProgressTasks || 0,
                                        completed: analytics.overview?.completedTasks || 0,
                                        blocked: 0
                                    }} />
                                ) : (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="empty-state py-6">
                                            <div className="empty-state-icon w-10 h-10">
                                                <BarChart3 className="w-5 h-5" />
                                            </div>
                                            <p className="text-xs text-gray-400">No task data available</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Priority Levels Chart */}
                        <div className="glass-card p-4 flex-1 min-h-0">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-semibold text-gray-500">Priority Levels</h3>
                                <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                            </div>
                            <div className="h-[calc(100%-28px)]">
                                {analytics ? (
                                    <TaskPriorityChart data={analytics.distributions?.priority || { low: 0, medium: 0, high: 0, critical: 0 }} />
                                ) : (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="empty-state py-6">
                                            <div className="empty-state-icon w-10 h-10">
                                                <Award className="w-5 h-5" />
                                            </div>
                                            <p className="text-xs text-gray-400">No priority data available</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Status Bar */}
            <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200" />
                        <span className="text-[11px] text-gray-400 font-medium">Database Connected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-200" />
                        <span className="text-[11px] text-gray-400 font-medium">API v1.02</span>
                    </div>
                </div>
                <p className="text-[11px] text-gray-300">© 2026 Admin Control Panel</p>
            </div>
        </div>
    );
}

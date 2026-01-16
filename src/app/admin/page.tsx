// src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSystemHealth, getDatabaseStats } from '@/lib/adminService';
import { authenticatedJsonFetch } from '@/lib/apiClient'
import { 
    Users, 
    BarChart3, 
    Award, 
    Activity, 
    Database, 
    Shield, 
    AlertTriangle, 
    TrendingUp, 
    Zap,
    CheckCircle2,
    Clock,
    Target
} from 'lucide-react';
import { TaskStatusChart, TaskPriorityChart } from '@/components/features/analytics'
import AdminVerificationQueue from '@/components/admin/AdminVerificationQueue';
import { StatCard, PageHeader, SectionCard } from '@/components/ui';
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
    const [analytics, setAnalytics] = useState<any>(null);
    const [allTasks, setAllTasks] = useState<any[]>([]);
    const [, setDataLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && user && isAdmin) {
            loadDashboardData();
        }
    }, [authLoading, user, isAdmin]);

    const loadDashboardData = async () => {
        try {
            setDataLoading(true);
            setError(null);

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

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse shadow-lg">
                        <Activity className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
                <div className="max-w-md w-full text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-200">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                        <AlertTriangle className="h-10 w-10 text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Admin Access Required</h2>
                    <p className="text-gray-600 mb-6">
                        Your account doesn&apos;t have admin privileges. Please contact the system administrator for access.
                    </p>
                    <div className="text-xs text-gray-400 font-mono bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                        User ID: {user?.uid?.slice(0, 16)}...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <PageHeader
                    icon={Shield}
                    title="Admin Dashboard"
                    description="Monitor system performance, manage users, and oversee platform operations"
                    actions={
                        <Button onClick={loadDashboardData} variant="outline" size="sm">
                            <Activity className="h-4 w-4 mr-2" />
                            Refresh Data
                        </Button>
                    }
                />

                {error && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Users"
                        value={dbStats?.users || 0}
                        icon={Users}
                        color="blue"
                        subtitle="Active accounts"
                    />
                    <StatCard
                        title="Active Teams"
                        value={dbStats?.teams || 0}
                        icon={Shield}
                        color="purple"
                        subtitle="Organized groups"
                    />
                    <StatCard
                        title="Tasks"
                        value={dbStats?.tasks || 0}
                        icon={CheckCircle2}
                        color="green"
                        subtitle={`${analytics?.overview?.completedTasks || 0} completed`}
                    />
                    <StatCard
                        title="KRA Goals"
                        value={dbStats?.kras || 0}
                        icon={Target}
                        color="orange"
                        subtitle="Performance metrics"
                    />
                </div>

                {/* Performance Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <SectionCard
                        icon={TrendingUp}
                        title="Task Completion"
                        description={`${analytics?.overview?.overallCompletionRate || 0}% overall rate`}
                    >
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    Completed
                                </span>
                                <span className="font-semibold">{analytics?.overview?.completedTasks || 0}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    In Progress
                                </span>
                                <span className="font-semibold">{analytics?.overview?.inProgressTasks || 0}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-gray-400" />
                                    Pending
                                </span>
                                <span className="font-semibold">
                                    {(analytics?.overview?.totalTasks || 0) - (analytics?.overview?.completedTasks || 0) - (analytics?.overview?.inProgressTasks || 0)}
                                </span>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="pt-2">
                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                                        style={{ width: `${analytics?.overview?.overallCompletionRate || 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard
                        icon={BarChart3}
                        title="Task Distribution"
                        description="By status"
                    >
                        <div className="h-56">
                            {analytics ? (
                                <TaskStatusChart data={{
                                    pending: (analytics.overview?.totalTasks || 0) - (analytics.overview?.completedTasks || 0) - (analytics.overview?.inProgressTasks || 0),
                                    'in-progress': analytics.overview?.inProgressTasks || 0,
                                    completed: analytics.overview?.completedTasks || 0,
                                    blocked: 0
                                }} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    <div className="text-center">
                                        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No data available</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </SectionCard>

                    <SectionCard
                        icon={Award}
                        title="Priority Breakdown"
                        description="Task priorities"
                    >
                        <div className="h-56">
                            {analytics ? (
                                <TaskPriorityChart data={analytics.distributions?.priority || { low: 0, medium: 0, high: 0, critical: 0 }} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    <div className="text-center">
                                        <Award className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No data available</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </SectionCard>
                </div>

                {/* Database Stats */}
                <SectionCard
                    icon={Database}
                    title="Database Overview"
                    description="Collection statistics"
                >
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { label: 'Users', count: dbStats?.users || 0, color: 'blue', icon: Users },
                            { label: 'Teams', count: dbStats?.teams || 0, color: 'purple', icon: Shield },
                            { label: 'Tasks', count: dbStats?.tasks || 0, color: 'green', icon: CheckCircle2 },
                            { label: 'KRAs', count: dbStats?.kras || 0, color: 'orange', icon: Target },
                            { label: 'Reports', count: dbStats?.reports || 0, color: 'pink', icon: BarChart3 },
                        ].map((item, i) => (
                            <div key={i} className="text-center p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                                <div className={`inline-flex p-3 rounded-lg mb-3 bg-${item.color}-50`}>
                                    <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 mb-1">{item.count}</p>
                                <p className="text-xs text-gray-600 font-medium">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                {/* Verification Queue */}
                <SectionCard
                    icon={Zap}
                    title="Verification Queue"
                    description="Tasks pending review"
                >
                    <AdminVerificationQueue
                        tasks={allTasks}
                        onVerificationComplete={loadDashboardData}
                    />
                </SectionCard>

                {/* Footer */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            <span>System Online</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <span>Database Connected</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400">© 2026 JewelMatrix Admin</p>
                </div>
            </div>
        </div>
    );
}

// src/app/admin/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSystemHealth, getDatabaseStats } from '@/lib/adminService';
import { authenticatedJsonFetch } from '@/lib/apiClient'
import { Users, Settings, BarChart3, Award, FileText, Bell, Server, Activity, Database, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskStatusChart, TaskPriorityChart } from '@/components/features/analytics'

interface SystemHealth {
    database: 'healthy' | 'warning' | 'error';
    firestore: 'healthy' | 'warning' | 'error';
    authentication: 'healthy' | 'warning' | 'error';
    storage: 'healthy' | 'warning' | 'error';
    lastBackup: Date | null;
    uptime: number;
    activeUsers: number;
    totalUsers: number;
}

interface DbStats {
    users: number;
    teams: number;
    tasks: number;
    kras: number;
    reports: number;
}

export default function AdminHome() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
    const [dbStats, setDbStats] = useState<DbStats | null>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [, setDataLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const adminCards = [
        {
            href: '/admin/users',
            icon: Users,
            title: 'Users',
            description: 'Manage users and platform access',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
            stats: dbStats ? `${dbStats.users} Total` : '...',
        },
        {
            href: '/admin/teams',
            icon: Settings,
            title: 'Teams',
            description: 'Create and manage organizational teams',
            bgColor: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
            stats: dbStats ? `${dbStats.teams} Total` : '...',
        },
        {
            href: '/admin/scoring',
            icon: Award,
            title: 'Scoring',
            description: 'Configure performance scoring weights',
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600',
        },
        {
            href: '/admin/analytics',
            icon: BarChart3,
            title: 'Analytics',
            description: 'System-wide performance analytics',
            bgColor: 'bg-amber-50',
            iconColor: 'text-amber-600',
            stats: analytics ? `${analytics.overview?.totalTasks || 0} Tasks` : '...',
        },
        {
            href: '/admin/reports',
            icon: FileText,
            title: 'Reports',
            description: 'View and manage team reports',
            bgColor: 'bg-sky-50',
            iconColor: 'text-sky-600',
            stats: dbStats ? `${dbStats.reports} Total` : '...',
        },
        {
            href: '/admin/system',
            icon: Server,
            title: 'System',
            description: 'Advanced administration & config',
            bgColor: 'bg-red-50',
            iconColor: 'text-red-600',
            stats: systemHealth ? `${systemHealth.uptime}% Uptime` : '...',
        },
        {
            href: '/admin/team-hub',
            icon: Users,
            title: 'Team Hub',
            description: 'Employee task overview & quick assignment',
            bgColor: 'bg-violet-50',
            iconColor: 'text-violet-600',
            stats: dbStats ? `${dbStats.users} Employees` : '...',
        }
    ];

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
            const [healthData, statsData, analyticsResult] = await Promise.all([
                getSystemHealth(),
                getDatabaseStats(),
                authenticatedJsonFetch('/api/analytics', {
                    headers: {
                        'x-user-id': user?.uid || ''
                    }
                })
            ]);

            setSystemHealth(healthData);
            setDbStats(statsData);

            if (analyticsResult.success && analyticsResult.data) {
                setAnalytics(analyticsResult.data);
            } else {
                // Don't throw error, just log it - permission issues are handled gracefully
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
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    // Show message if user is not admin
    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="max-w-md text-center p-8 bg-amber-50 border border-amber-200 rounded-2xl">
                    <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
                    <p className="text-gray-600 text-sm mb-4">
                        Your account doesn&apos;t have admin privileges. Please contact the system administrator to get access.
                    </p>
                    <p className="text-xs text-gray-400">
                        User ID: {user?.uid?.slice(0, 8)}...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-12">
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                        <Activity className="h-3 w-3 text-blue-500" />
                        Live platform monitoring & management
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-black text-gray-400`}>U{i}</div>
                        ))}
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold uppercase tracking-wide">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Users', value: dbStats?.users || 0, icon: Users, color: 'text-blue-500', trend: '+12%' },
                    { label: 'Active Teams', value: dbStats?.teams || 0, icon: Shield, color: 'text-indigo-500', trend: 'Stable' },
                    { label: 'Active Tasks', value: dbStats?.tasks || 0, icon: Activity, color: 'text-green-500', trend: '+5%' },
                    { label: 'Cloud Health', value: '99.9%', icon: Database, color: 'text-amber-500', trend: 'Optimal' }
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ${stat.color}`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-semibold text-green-500">{stat.trend}</span>
                            </div>
                            <p className="text-xs font-medium text-gray-500 leading-none">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Management Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Modules */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-700">Management Modules</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {adminCards.map((card, index) => (
                            <Link key={index} href={card.href} className="group">
                                <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-blue-500 transition-all flex items-start gap-4">
                                    <div className={`w-12 h-12 shrink-0 rounded-2xl ${card.bgColor} ${card.iconColor} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                                        <card.icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{card.title}</h3>
                                        <p className="text-gray-500 text-xs leading-relaxed mt-1 line-clamp-2">{card.description}</p>
                                        {card.stats && (
                                            <div className="inline-block mt-3 px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-blue-600">
                                                {card.stats}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Side Analytics */}
                <div className="space-y-6">
                    <h2 className="text-sm font-semibold text-gray-700">Live Insights</h2>

                    <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                        <CardHeader className="pb-2 border-b border-gray-50 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-semibold text-gray-500">Task Distribution</CardTitle>
                            <Activity className="h-3 w-3 text-blue-500" />
                        </CardHeader>
                        <CardContent className="p-6">
                            {analytics ? (
                                <TaskStatusChart data={{
                                    pending: analytics.overview?.totalTasks - analytics.overview?.completedTasks - analytics.overview?.inProgressTasks || 0,
                                    'in-progress': analytics.overview?.inProgressTasks || 0,
                                    completed: analytics.overview?.completedTasks || 0,
                                    blocked: 0
                                }} />
                            ) : (
                                <div className="h-40 flex items-center justify-center text-sm text-gray-400">
                                    Loading data...
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                        <CardHeader className="pb-2 border-b border-gray-50 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-semibold text-gray-500">Priority Levels</CardTitle>
                            <Shield className="h-3 w-3 text-amber-500" />
                        </CardHeader>
                        <CardContent className="p-6">
                            {analytics ? (
                                <TaskPriorityChart data={analytics.distributions?.priority || { low: 0, medium: 0, high: 0, critical: 0 }} />
                            ) : (
                                <div className="h-40 flex items-center justify-center text-sm text-gray-400">
                                    Loading data...
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Footer Status */}
            <div className="pt-10 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-gray-500">Database Linked</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-xs text-gray-500">API v1.02 Ready</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400">© 2026 Admin Control Panel</p>
                </div>
            </div>
        </div>
    );
}

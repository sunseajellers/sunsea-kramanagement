// src/app/admin/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSystemHealth, getDatabaseStats } from '@/lib/adminService';
import { authenticatedJsonFetch } from '@/lib/apiClient'
import { Users, BarChart3, Award, FileText, Server, Activity, Database, Shield, AlertTriangle, TrendingUp, Zap, ArrowRight } from 'lucide-react';
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
            href: '/admin/organization',
            icon: Shield,
            title: 'Organization Hub',
            description: 'Manage workforce, teams, and performance monitoring',
            bgColor: 'from-blue-500 to-cyan-500',
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            stats: dbStats ? `${dbStats.users} Users / ${dbStats.teams} Teams` : '...',
        },
        {
            href: '/admin/operations',
            icon: FileText,
            title: 'Operations Hub',
            description: 'Global task management and KRA automation engine',
            bgColor: 'from-purple-500 to-fuchsia-500',
            iconBg: 'bg-purple-50',
            iconColor: 'text-purple-600',
            stats: dbStats ? `${dbStats.tasks} Active Tasks` : '...',
        },
        {
            href: '/admin/performance',
            icon: BarChart3,
            title: 'Performance Hub',
            description: 'Analytics, scoring algorithms, and historical archives',
            bgColor: 'from-amber-500 to-orange-500',
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
            stats: analytics ? `${analytics.overview?.overallCompletionRate}% Comp. Rate` : '...',
        },
        {
            href: '/admin/system',
            icon: Server,
            title: 'System Config',
            description: 'Platform configuration and administration tools',
            bgColor: 'from-rose-500 to-pink-500',
            iconBg: 'bg-red-50',
            iconColor: 'text-red-600',
            stats: systemHealth ? `${systemHealth.uptime}% Uptime` : '...',
        },
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

                {/* Left Column - Management Modules */}
                <div className="flex flex-col gap-4 min-h-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-700">Quick Access</h2>
                        <span className="text-[10px] text-gray-400 font-medium">6 modules</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 flex-1 scroll-panel pr-1">
                        {adminCards.map((card, index) => (
                            <Link key={index} href={card.href} className="group">
                                <div className="module-card h-full flex flex-col">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`icon-box icon-box-md ${card.iconBg} ${card.iconColor} group-hover:scale-110 transition-transform`}>
                                            <card.icon className="h-5 w-5" />
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-1">{card.title}</h3>
                                    <p className="text-[11px] text-gray-400 leading-relaxed mb-3 line-clamp-2 flex-1">{card.description}</p>
                                    {card.stats && (
                                        <div className="inline-flex self-start px-2.5 py-1 bg-gray-50 rounded-md text-[10px] font-semibold text-purple-600">
                                            {card.stats}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
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

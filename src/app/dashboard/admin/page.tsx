// src/app/dashboard/admin/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { getSystemHealth, getDatabaseStats } from '@/lib/adminService';
import { authenticatedJsonFetch } from '@/lib/apiClient'
import { Users, Settings, BarChart3, Award, FileText, TrendingUp, Bell, Server, Activity, Database, Shield, AlertTriangle, RefreshCw, Download, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TaskStatusChart from '@/components/charts/TaskStatusChart';
import TaskPriorityChart from '@/components/charts/TaskPriorityChart';
import TaskTrendChart from '@/components/charts/TaskTrendChart';

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
    const { userData } = useAuth();
    const { hasPermission } = usePermissions();
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
    const [dbStats, setDbStats] = useState<DbStats | null>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const allAdminCards = [
        {
            href: '/dashboard/admin/users',
            icon: Users,
            title: 'User Management',
            description: 'Manage users, roles, and permissions',
            color: 'from-blue-500 to-blue-600',
            stats: dbStats ? `${dbStats.users} users` : 'Loading...',
            requiredPermission: { module: 'users', action: 'view' }
        },
        {
            href: '/dashboard/admin/teams',
            icon: Settings,
            title: 'Team Management',
            description: 'Create and manage teams',
            color: 'from-purple-500 to-purple-600',
            stats: dbStats ? `${dbStats.teams} teams` : 'Loading...',
            requiredPermission: { module: 'teams', action: 'view' }
        },
        {
            href: '/dashboard/admin/scoring',
            icon: Award,
            title: 'Scoring Configuration',
            description: 'Configure performance scoring weights',
            color: 'from-green-500 to-green-600',
            requiredPermission: { module: 'scoring', action: 'manage' }
        },
        {
            href: '/dashboard/admin/analytics',
            icon: BarChart3,
            title: 'Analytics',
            description: 'View system-wide analytics',
            color: 'from-orange-500 to-orange-600',
            stats: analytics ? `${analytics.overview?.totalTasks || 0} tasks` : 'Loading...',
            requiredPermission: { module: 'analytics', action: 'view' }
        },
        {
            href: '/dashboard/admin/notifications',
            icon: Bell,
            title: 'Notifications',
            description: 'Manage notification rules and templates',
            color: 'from-red-500 to-red-600',
            requiredPermission: { module: 'notifications', action: 'manage' }
        },
        {
            href: '/dashboard/admin/reports',
            icon: FileText,
            title: 'Weekly Reports',
            description: 'View and manage team reports',
            color: 'from-pink-500 to-pink-600',
            stats: dbStats ? `${dbStats.reports} reports` : 'Loading...',
            requiredPermission: { module: 'reports', action: 'view' }
        },
        {
            href: '/dashboard/admin/roles',
            icon: Shield,
            title: 'Role Management',
            description: 'Manage roles and permissions',
            color: 'from-indigo-500 to-indigo-600',
            requiredPermission: { module: 'roles', action: 'manage' }
        }
    ];

    // Filter cards based on permissions
    const adminCards = allAdminCards.filter(card =>
        hasPermission(card.requiredPermission.module, card.requiredPermission.action)
    );

    // Add system admin card if user has system permission
    if (hasPermission('system', 'manage')) {
        adminCards.push({
            href: '/dashboard/admin/system',
            icon: Server,
            title: 'System Administration',
            description: 'Advanced system management and configuration',
            color: 'from-red-500 to-red-700',
            stats: systemHealth ? `${systemHealth.uptime}% uptime` : 'Loading...',
            requiredPermission: { module: 'system', action: 'manage' }
        });
    }

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [healthData, statsData, analyticsResult] = await Promise.all([
                getSystemHealth(),
                getDatabaseStats(),
                authenticatedJsonFetch('/api/analytics')
            ]);

            setSystemHealth(healthData);
            setDbStats(statsData);
            
            if (analyticsResult.success && analyticsResult.data) {
                setAnalytics(analyticsResult.data);
            } else {
                throw new Error(analyticsResult.error || 'Failed to load analytics');
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            setError('Failed to load dashboard data. Please check your permissions and try again.');
        } finally {
            setLoading(false);
        }
    };

    const getHealthStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-green-600';
            case 'warning': return 'text-yellow-600';
            case 'error': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getHealthStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <Activity className="h-4 w-4 text-green-600" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
            case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
            default: return <Activity className="h-4 w-4 text-gray-600" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with Refresh */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Manage your system and monitor performance</p>
                </div>
                <Button onClick={loadDashboardData} disabled={loading} variant="outline">
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-red-800">
                            <AlertTriangle className="h-5 w-5" />
                            <span>{error}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* System Health Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">System Status</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {getHealthStatusIcon(systemHealth?.database || 'error')}
                                    <span className="text-lg font-semibold">Healthy</span>
                                </div>
                            </div>
                            <Shield className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                                <p className="text-2xl font-bold">{systemHealth?.activeUsers || 0}</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                                <p className="text-2xl font-bold">{analytics?.overview?.totalTasks || 0}</p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">System Uptime</p>
                                <p className="text-2xl font-bold">{systemHealth?.uptime || 0}%</p>
                            </div>
                            <Database className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Analytics Charts */}
            {analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Task Status Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TaskStatusChart data={{
                                pending: analytics.overview?.totalTasks - analytics.overview?.completedTasks - analytics.overview?.inProgressTasks || 0,
                                'in-progress': analytics.overview?.inProgressTasks || 0,
                                completed: analytics.overview?.completedTasks || 0,
                                blocked: 0 // Mock, can be added later
                            }} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Task Priority Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TaskPriorityChart data={analytics.distributions?.priority || { low: 0, medium: 0, high: 0, critical: 0 }} />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Admin Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminCards.map((card, index) => (
                    <Link key={index} href={card.href}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardContent className="p-6">
                                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${card.color} flex items-center justify-center mb-4`}>
                                    <card.icon className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                                <p className="text-muted-foreground text-sm mb-3">{card.description}</p>
                                {card.stats && (
                                    <Badge variant="secondary" className="text-xs">
                                        {card.stats}
                                    </Badge>
                                )}
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Quick Actions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button variant="outline" className="justify-start">
                            <Download className="h-4 w-4 mr-2" />
                            Export Reports
                        </Button>
                        <Button variant="outline" className="justify-start">
                            <Users className="h-4 w-4 mr-2" />
                            Bulk User Import
                        </Button>
                        <Button variant="outline" className="justify-start">
                            <Settings className="h-4 w-4 mr-2" />
                            System Backup
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Activity & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-muted rounded">
                                <Users className="h-4 w-4 text-blue-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">New user registered</p>
                                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted rounded">
                                <Settings className="h-4 w-4 text-purple-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Team configuration updated</p>
                                    <p className="text-xs text-muted-foreground">15 minutes ago</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted rounded">
                                <BarChart3 className="h-4 w-4 text-green-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Weekly report generated</p>
                                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            System Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {systemHealth?.database === 'error' && (
                                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-red-800">Database Connection Issue</p>
                                        <p className="text-xs text-red-600">Check database connectivity</p>
                                    </div>
                                </div>
                            )}
                            {systemHealth?.firestore === 'warning' && (
                                <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-yellow-800">Firestore Performance</p>
                                        <p className="text-xs text-yellow-600">Response times above threshold</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                <Activity className="h-4 w-4 text-blue-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-800">System Healthy</p>
                                    <p className="text-xs text-blue-600">All systems operating normally</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDatabaseStats } from '@/lib/adminService';
import {
    Users,
    Shield,
    AlertTriangle,
    CheckCircle2,
    Target,
    Activity,
    Loader2
} from 'lucide-react';
import AdminVerificationQueue from '@/components/admin/AdminVerificationQueue';
import { cn } from '@/lib/utils';

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

            // Fetch data with individual error handling to prevent complete failure
            try {
                const statsData = await getDatabaseStats();
                setDbStats(statsData);
            } catch (err) {
                console.error('Failed to fetch stats:', err);
                // Non-critical, just keep stats as null
            }

            try {
                const tasksData = await getAllTasks(200);
                setAllTasks(tasksData);
            } catch (err) {
                console.error('Failed to fetch verification tasks:', err);
                setError('We couldn\'t load the tasks. Please check your connection and try again.');
            }

        } catch (error) {
            console.error('Critical failure in dashboard data orchestration:', error);
            setError('Something went wrong while loading the dashboard. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background animate-in fade-in duration-700">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-primary/5 flex items-center justify-center animate-pulse shadow-2xl shadow-primary/10 border border-primary/10">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Checking Permissions</p>
                        <p className="text-sm text-muted-foreground font-medium">Loading executive dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-6 animate-in zoom-in-95 duration-500">
                <div className="max-w-md w-full text-center p-12 bg-white rounded-[3rem] shadow-2xl border border-slate-100 group">
                    <div className="w-24 h-24 mx-auto mb-8 rounded-[2rem] bg-rose-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <AlertTriangle className="h-12 w-12 text-rose-500" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Access Denied</h2>
                    <p className="text-slate-500 mb-10 font-medium leading-relaxed">
                        You don't have permission to access this area. Please contact your administrator if you think this is a mistake.
                    </p>
                    <div className="text-[10px] font-black text-slate-400 font-mono bg-slate-50 rounded-2xl px-6 py-4 border border-slate-100 tracking-widest break-all">
                        UID: {user?.uid}
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
        <div className="space-y-16 animate-in">
            {/* Page Header */}
            <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div>
                    <h1 className="section-title">Company Overview</h1>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-success shadow-lg shadow-success/20" />
                        <p className="section-subtitle">
                            System active for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-5">
                    <button
                        onClick={loadDashboardData}
                        className="btn-secondary h-14 group"
                        disabled={loading}
                    >
                        <Activity className={cn("h-5 w-5 transition-transform duration-700", loading && "animate-spin")} />
                        Update Reports
                    </button>
                    <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/20 group hover:scale-110 transition-transform cursor-pointer">
                        <Shield className="w-7 h-7" />
                    </div>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="flex items-center gap-6 p-8 bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] text-rose-700 text-sm font-bold animate-in">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-rose-500 shadow-sm">
                        <AlertTriangle className="h-7 w-7" />
                    </div>
                    <span>{error}</span>
                </div>
            )}

            {/* Core Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Total Team', value: dbStats?.users || 0, icon: Users, color: 'text-primary', bg: 'bg-primary/5', sub: 'Members' },
                    { label: 'Active Groups', value: dbStats?.teams || 0, icon: Shield, color: 'text-success', bg: 'bg-success/5', sub: 'Departments' },
                    { label: 'Work Items', value: dbStats?.tasks || 0, icon: CheckCircle2, color: 'text-secondary', bg: 'bg-secondary/5', sub: 'Assignments' },
                    { label: 'Primary Goals', value: dbStats?.kras || 0, icon: Target, color: 'text-warning', bg: 'bg-warning/5', sub: 'Objectives' },
                ].map((stat, i) => (
                    <div key={i} className="dashboard-card group hover:shadow-hover hover:-translate-y-2 transition-all duration-500">
                        <div className="flex items-start justify-between">
                            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm", stat.bg, stat.color)}>
                                <stat.icon className="h-8 w-8" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">MT-{i + 1}</span>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-5xl font-black text-primary leading-none transition-colors">
                                {stat.value}
                            </h3>
                            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Operational Health Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {[
                    { label: 'Success Rate', count: completedTasks, rate: taskCompletionRate, sub: 'Work Done', color: 'bg-primary', accent: 'text-primary', icon: CheckCircle2 },
                    { label: 'In Progress', count: inProgressTasks, rate: allTasks.length > 0 ? (inProgressTasks / allTasks.length) * 100 : 0, sub: 'Active Flow', color: 'bg-secondary', accent: 'text-secondary', icon: Activity },
                    { label: 'Awaiting Review', count: pendingTasks, rate: allTasks.length > 0 ? (pendingTasks / allTasks.length) * 100 : 0, sub: 'Needs Attention', color: 'bg-destructive', accent: 'text-destructive', icon: Target },
                ].map((item, i) => (
                    <div key={i} className="glass-panel p-10 flex flex-col justify-between group hover:shadow-hover transition-all duration-500">
                        <div className="flex items-center justify-between mb-10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em]">{item.sub}</p>
                                <p className="text-2xl font-black text-primary uppercase tracking-tight">{item.label}</p>
                            </div>
                            <div className={cn("w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center transition-all group-hover:scale-110 shadow-sm", item.accent)}>
                                <item.icon className="w-7 h-7" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Calculated Progress</span>
                                <span className={cn("text-lg font-black", item.accent)}>{Math.round(item.rate)}%</span>
                            </div>
                            <div className="h-3 bg-muted rounded-full overflow-hidden p-0.5 border border-border/50">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-1000 ease-out shadow-sm", item.color)}
                                    style={{ width: `${item.rate}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-end">
                                <span className="text-3xl font-black text-primary tracking-tight">{item.count} <span className="text-[10px] text-muted-foreground/40 ml-1">ITEMS</span></span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Review Center - Highlighted Section */}
            {pendingTasks > 0 && (
                <div className="glass-panel p-12 space-y-12 relative overflow-hidden group/terminal border-l-[12px] border-l-destructive shadow-2xl shadow-destructive/5">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover/terminal:rotate-12 transition-transform duration-1000">
                        <Activity className="w-96 h-96 text-primary" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12 pb-12 border-b border-border/40">
                        <div className="space-y-4">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-destructive/10 rounded-[1.5rem] relative">
                                    <div className="absolute inset-0 bg-destructive/20 rounded-[1.5rem] animate-ping" />
                                    <Shield className="h-8 w-8 text-destructive relative" />
                                </div>
                                <h2 className="text-4xl font-black text-primary uppercase tracking-tight">Review Center</h2>
                            </div>
                            <p className="text-base font-bold text-muted-foreground flex items-center gap-4">
                                <span className="flex h-3 w-3 rounded-full bg-destructive shadow-lg shadow-destructive/40" />
                                <span className="text-destructive font-black uppercase tracking-widest">{pendingTasks} items</span> are waiting for your final approval
                            </p>
                        </div>
                        <button className="btn-primary h-16 px-12 text-sm tracking-widest shadow-destructive/10">
                            Start All Reviews
                        </button>
                    </div>

                    <div className="relative z-10">
                        <AdminVerificationQueue
                            tasks={allTasks}
                            onVerificationComplete={loadDashboardData}
                        />
                    </div>
                </div>
            )}
        </div>
    );

}

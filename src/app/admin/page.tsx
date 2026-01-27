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
            <div className="min-h-screen flex items-center justify-center bg-white animate-in fade-in duration-700">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-50 flex items-center justify-center animate-pulse shadow-2xl shadow-indigo-100/50 border border-indigo-100">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Authenticating Executive Access</p>
                        <p className="text-sm text-slate-400 font-medium">Loading executive dashboard...</p>
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
                        Your current credentials do not grant executive administrative authority. Contact system oversight if this is an error.
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
        <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="section-title">Executive Overview</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            SYSTEM OPERATIONAL: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={loadDashboardData}
                        className="btn-secondary h-14 px-8 group flex items-center justify-center gap-3 rounded-2xl bg-white border-2 border-slate-100 text-slate-900 font-black text-[11px] uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        disabled={loading}
                    >
                        <Activity className={cn("h-5 w-5 transition-transform duration-700 group-hover:rotate-180", loading && "animate-spin text-indigo-500")} />
                        Refresh Intelligence
                    </button>
                    <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-900/20 group hover:scale-110 transition-transform cursor-pointer">
                        <Shield className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="flex items-center gap-6 px-10 py-6 bg-rose-50 border-2 border-rose-100 rounded-[2rem] text-rose-700 text-sm font-black shadow-xl shadow-rose-100/20 animate-in slide-in-from-top-4 uppercase tracking-tight">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-rose-500 shadow-sm">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <span>{error}</span>
                </div>
            )}

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Total Personnel', value: dbStats?.users || 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', sub: 'Authorized Users' },
                    { label: 'Active Teams', value: dbStats?.teams || 0, icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Strategic Units' },
                    { label: 'Ongoing Tasks', value: dbStats?.tasks || 0, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'Tactical Flows' },
                    { label: 'Active KRAs', value: dbStats?.kras || 0, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50', sub: 'Execution Goals' },
                ].map((stat, i) => (
                    <div key={i} className="dashboard-card group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                        <div className="flex items-start justify-between mb-8">
                            <div className={cn("w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all group-hover:scale-110 shadow-sm", stat.bg, stat.color)}>
                                <stat.icon className="h-7 w-7" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">METRIC-0{i + 1}</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.sub}</p>
                            <h3 className="text-4xl font-black text-slate-900 leading-none tracking-tight group-hover:text-indigo-600 transition-colors">
                                {stat.value}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Operational Status Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {[
                    { label: 'Execution Rate', count: completedTasks, rate: taskCompletionRate, sub: 'Personnel Throughput', color: 'bg-indigo-600', accent: 'text-indigo-600', icon: CheckCircle2 },
                    { label: 'Work in Progress', count: inProgressTasks, rate: allTasks.length > 0 ? (inProgressTasks / allTasks.length) * 100 : 0, sub: 'Operational Flow', color: 'bg-slate-900', accent: 'text-slate-900', icon: Activity },
                    { label: 'Pending Audit', count: pendingTasks, rate: allTasks.length > 0 ? (pendingTasks / allTasks.length) * 100 : 0, sub: 'Needs Executive Action', color: 'bg-rose-500', accent: 'text-rose-500', icon: Target },
                ].map((item, i) => (
                    <div key={i} className="glass-panel p-8 flex flex-col justify-between group hover:shadow-2xl transition-all duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.sub}</p>
                                <p className="text-xl font-black text-slate-900 uppercase tracking-tight">{item.label}</p>
                            </div>
                            <div className={cn("w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center transition-all group-hover:scale-110 shadow-sm", item.accent)}>
                                <item.icon className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Load</span>
                                <span className={cn("text-sm font-black transition-colors", item.accent)}>{Math.round(item.rate)}%</span>
                            </div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-1000 ease-out shadow-sm", item.color)}
                                    style={{ width: `${item.rate}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-end">
                                <span className="text-2xl font-black text-slate-900 tracking-tight">{item.count} <span className="text-[10px] text-slate-400 ml-1">UNITS</span></span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Verification Queue - Highlighted Section */}
            {pendingTasks > 0 && (
                <div className="glass-panel p-10 space-y-10 relative overflow-hidden group/terminal border-l-8 border-l-rose-500">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover/terminal:rotate-12 transition-transform duration-1000">
                        <Activity className="w-72 h-72 text-slate-900" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10 pb-10 border-b border-slate-100">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-rose-50 rounded-2xl relative shadow-sm">
                                    <div className="absolute inset-0 bg-rose-500/20 rounded-2xl animate-ping" />
                                    <Shield className="h-6 w-6 text-rose-500 relative" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Verification Terminal</h2>
                            </div>
                            <p className="text-sm font-bold text-slate-500 mt-2 flex items-center gap-3">
                                <span className="flex h-2 w-2 rounded-full bg-rose-500" />
                                <span className="text-rose-600 font-black uppercase tracking-widest text-xs">{pendingTasks} critical entities</span> require executive review protocol
                            </p>
                        </div>
                        <button className="btn-primary h-16 px-10 rounded-[1.5rem] shadow-xl shadow-indigo-100 group-hover/terminal:scale-105 transition-transform">
                            Initialize All Audits
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

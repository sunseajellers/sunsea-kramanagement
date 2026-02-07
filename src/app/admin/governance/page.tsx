// src/app/admin/governance/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { okrService } from '@/lib/okrService';
import { getAllKRAs } from '@/lib/kraService';
import { getAllKPIs } from '@/lib/kpiService';
import { cn } from '@/lib/utils';
import {
    Target,
    TrendingUp,
    BarChart3,
    Users,
    CheckCircle2,
    AlertTriangle,
    Activity,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Zap,
    Shield,
    Award
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { Objective, KRA, KPI } from '@/types';

interface GovernanceStats {
    totalOKRs: number;
    activeOKRs: number;
    completedOKRs: number;
    avgOKRProgress: number;
    totalKRAs: number;
    activeKRAs: number;
    totalKPIs: number;
    onTrackKPIs: number;
    atRiskKPIs: number;
}

export default function GovernanceDashboard() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<GovernanceStats | null>(null);
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [kras, setKras] = useState<KRA[]>([]);
    const [kpis, setKpis] = useState<KPI[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && user && isAdmin) {
            loadGovernanceData();
        } else if (!authLoading && (!user || !isAdmin)) {
            setLoading(false);
        }
    }, [authLoading, user, isAdmin]);

    const loadGovernanceData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all governance data in parallel
            const [okrStats, objectivesData, krasData, kpisData] = await Promise.all([
                okrService.getOKRStats(),
                okrService.getObjectives(),
                getAllKRAs(100),
                getAllKPIs()
            ]);

            setObjectives(objectivesData);
            setKras(krasData);
            setKpis(kpisData);

            // Calculate KPI health
            const onTrackKPIs = kpisData.filter(k => {
                const target = k.benchmark || k.nextWeekTarget || 0;
                const actual = k.currentWeekActual || 0;
                return target > 0 && (actual / target) >= 0.7;
            }).length;

            setStats({
                totalOKRs: okrStats.total,
                activeOKRs: okrStats.active,
                completedOKRs: okrStats.completed,
                avgOKRProgress: okrStats.avgProgress,
                totalKRAs: krasData.length,
                activeKRAs: krasData.filter(k => k.status === 'in_progress').length,
                totalKPIs: kpisData.length,
                onTrackKPIs,
                atRiskKPIs: kpisData.length - onTrackKPIs
            });

        } catch (err) {
            console.error('Failed to load governance data:', err);
            setError('Failed to load governance data. Please try again.');
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
                        <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Loading Governance</p>
                        <p className="text-sm text-muted-foreground font-medium">Fetching OKR, KRA, and KPI data...</p>
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
                        Governance dashboard requires administrator access.
                    </p>
                </div>
            </div>
        );
    }

    const getProgressColor = (progress: number) => {
        if (progress >= 70) return 'bg-emerald-500';
        if (progress >= 40) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
            case 'in_progress':
                return 'status-badge-info';
            case 'completed':
                return 'status-badge-success';
            case 'at_risk':
                return 'status-badge-danger';
            default:
                return 'status-badge-neutral';
        }
    };

    return (
        <div className="space-y-16 animate-in">
            {/* Page Header */}
            <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div>
                    <h1 className="section-title">Performance Governance</h1>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-success shadow-lg shadow-success/20" />
                        <p className="section-subtitle">
                            OKR • KRA • KPI Dashboard — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-5">
                    <button
                        onClick={loadGovernanceData}
                        className="btn-secondary h-14 group"
                        disabled={loading}
                    >
                        <Activity className={cn("h-5 w-5 transition-transform duration-700", loading && "animate-spin")} />
                        Refresh Data
                    </button>
                    <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/20 group hover:scale-110 transition-transform cursor-pointer">
                        <Target className="w-7 h-7" />
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

            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Total Objectives', value: stats?.totalOKRs || 0, icon: Target, color: 'text-primary', bg: 'bg-primary/5', sub: 'OKRs Defined' },
                    { label: 'Active OKRs', value: stats?.activeOKRs || 0, icon: Zap, color: 'text-success', bg: 'bg-success/5', sub: 'In Progress' },
                    { label: 'Key Result Areas', value: stats?.totalKRAs || 0, icon: BarChart3, color: 'text-secondary', bg: 'bg-secondary/5', sub: 'KRAs Assigned' },
                    { label: 'Performance KPIs', value: stats?.totalKPIs || 0, icon: TrendingUp, color: 'text-warning', bg: 'bg-warning/5', sub: 'Metrics Tracked' },
                ].map((stat, i) => (
                    <div key={i} className="dashboard-card group hover:shadow-hover hover:-translate-y-2 transition-all duration-500">
                        <div className="flex items-start justify-between">
                            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm", stat.bg, stat.color)}>
                                <stat.icon className="h-8 w-8" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">G-{i + 1}</span>
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

            {/* OKR Progress Overview */}
            <div className="glass-panel p-12 space-y-10">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-primary uppercase tracking-tight">OKR Progress Overview</h2>
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
                            Average Progress: {stats?.avgOKRProgress || 0}%
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">On Track (≥70%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">At Risk (40-69%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Behind (&lt;40%)</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {objectives.slice(0, 5).map((obj, i) => (
                        <div key={obj.id} className="p-6 bg-white/50 rounded-2xl border border-border/30 hover:shadow-lg transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-black text-sm">
                                        O{i + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-primary text-sm">{obj.title}</h4>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                            {obj.ownerName} • {obj.timeframe}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={cn("status-badge", getStatusBadge(obj.status))}>
                                        {obj.status.replace('_', ' ')}
                                    </span>
                                    <span className="text-2xl font-black text-primary">{obj.progress}%</span>
                                </div>
                            </div>
                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-1000", getProgressColor(obj.progress))}
                                    style={{ width: `${obj.progress}%` }}
                                />
                            </div>
                        </div>
                    ))}

                    {objectives.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p className="font-bold">No objectives defined yet</p>
                            <p className="text-sm">Create your first OKR to get started</p>
                        </div>
                    )}
                </div>
            </div>

            {/* KRA & KPI Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* KRA Summary */}
                <div className="glass-panel p-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center">
                                <BarChart3 className="w-7 h-7 text-secondary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-primary uppercase">Key Result Areas</h3>
                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                    {stats?.activeKRAs || 0} Active / {stats?.totalKRAs || 0} Total
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 max-h-80 overflow-y-auto">
                        {kras.slice(0, 6).map((kra) => (
                            <div key={kra.id} className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-border/30">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-2.5 h-2.5 rounded-full",
                                        kra.status === 'in_progress' ? 'bg-blue-500' :
                                            kra.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-300'
                                    )} />
                                    <div>
                                        <p className="font-bold text-sm text-primary">{kra.title}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">{kra.type} • {kra.priority}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Progress value={kra.progress} className="w-20 h-2" />
                                    <span className="text-sm font-black text-primary w-12 text-right">{kra.progress}%</span>
                                </div>
                            </div>
                        ))}

                        {kras.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p className="font-bold text-sm">No KRAs defined</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* KPI Health */}
                <div className="glass-panel p-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center">
                                <TrendingUp className="w-7 h-7 text-warning" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-primary uppercase">KPI Health Monitor</h3>
                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                    {stats?.onTrackKPIs || 0} On Track / {stats?.atRiskKPIs || 0} At Risk
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* KPI Health Distribution */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <div className="flex items-center justify-between mb-3">
                                <ArrowUpRight className="w-6 h-6 text-emerald-500" />
                                <span className="text-3xl font-black text-emerald-600">{stats?.onTrackKPIs || 0}</span>
                            </div>
                            <p className="text-xs font-bold text-emerald-700 uppercase">On Track</p>
                        </div>
                        <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100">
                            <div className="flex items-center justify-between mb-3">
                                <ArrowDownRight className="w-6 h-6 text-rose-500" />
                                <span className="text-3xl font-black text-rose-600">{stats?.atRiskKPIs || 0}</span>
                            </div>
                            <p className="text-xs font-bold text-rose-700 uppercase">At Risk</p>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-48 overflow-y-auto">
                        {kpis.slice(0, 4).map((kpi) => {
                            const target = kpi.benchmark || kpi.nextWeekTarget || 0;
                            const actual = kpi.currentWeekActual || 0;
                            const percentage = target > 0 ? Math.round((actual / target) * 100) : 0;
                            const isOnTrack = percentage >= 70;

                            return (
                                <div key={kpi.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-border/30">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            isOnTrack ? 'bg-emerald-500' : 'bg-rose-500'
                                        )} />
                                        <span className="text-xs font-bold text-primary">{kpi.name}</span>
                                    </div>
                                    <span className={cn(
                                        "text-xs font-black",
                                        isOnTrack ? 'text-emerald-600' : 'text-rose-600'
                                    )}>
                                        {actual}/{target} ({percentage}%)
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Governance Framework Summary */}
            <div className="glass-panel p-12 border-l-[8px] border-l-primary">
                <div className="flex items-start gap-8">
                    <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                        <Award className="w-10 h-10 text-primary" />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-2xl font-black text-primary uppercase tracking-tight">Governance Framework Active</h3>
                        <p className="text-muted-foreground font-medium max-w-2xl">
                            Your organization's OKR → KRA → KPI structure is operational. Performance metrics are being tracked
                            across all departments with real-time visibility into progress and health indicators.
                        </p>
                        <div className="flex items-center gap-6 pt-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                <span className="text-sm font-bold text-primary">{stats?.completedOKRs || 0} OKRs Completed</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-500" />
                                <span className="text-sm font-bold text-primary">{stats?.activeOKRs || 0} In Progress</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-secondary" />
                                <span className="text-sm font-bold text-primary">{stats?.totalKRAs || 0} KRAs Assigned</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

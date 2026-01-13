// src/app/dashboard/kpi/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { KPI } from '@/types';
import {
    Target,
    TrendingUp,
    TrendingDown,
    Calendar,
    Save,
    ArrowLeft,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface KPIWithKRA extends KPI {
    kraTitle?: string;
}

export default function KPIWeeklyInput() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [kpis, setKpis] = useState<KPIWithKRA[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [editedKpis, setEditedKpis] = useState<Record<string, Partial<KPI>>>({});

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }
        if (user) {
            fetchMyKPIs();
        }
    }, [user, authLoading]);

    const fetchMyKPIs = async () => {
        try {
            setLoading(true);
            const token = await user?.getIdToken();
            const response = await fetch(`/api/kpis?userId=${user?.uid}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (response.ok) {
                const data = await response.json();
                setKpis(data.kpis || []);
            }
        } catch (error) {
            console.error('Error fetching KPIs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (kpiId: string, field: keyof KPI, value: number | string) => {
        setEditedKpis(prev => ({
            ...prev,
            [kpiId]: {
                ...prev[kpiId],
                [field]: value
            }
        }));
        setSaved(false);
    };

    const getValue = (kpi: KPI, field: keyof KPI): number => {
        if (editedKpis[kpi.id]?.[field] !== undefined) {
            return editedKpis[kpi.id][field] as number;
        }
        return (kpi[field] as number) || 0;
    };

    const calculateVariance = (kpi: KPI): number => {
        const planned = getValue(kpi, 'currentWeekPlanned');
        const actual = getValue(kpi, 'currentWeekActual');
        if (planned === 0) return 0;
        return Math.round(((actual - planned) / planned) * 100);
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            const token = await user?.getIdToken();

            for (const [kpiId, updates] of Object.entries(editedKpis)) {
                await fetch(`/api/kpis/${kpiId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify(updates)
                });
            }

            setSaved(true);
            setEditedKpis({});
            await fetchMyKPIs();
        } catch (error) {
            console.error('Error saving KPIs:', error);
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    const hasChanges = Object.keys(editedKpis).length > 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="p-2 hover:bg-slate-100 rounded-lg transition"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Weekly KPI Input</h1>
                                <p className="text-sm text-slate-500">
                                    Week: {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {saved && (
                                <span className="flex items-center gap-1 text-green-600 text-sm">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Saved
                                </span>
                            )}
                            <button
                                onClick={handleSaveAll}
                                disabled={!hasChanges || saving}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save All
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {kpis.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                                <Target className="w-8 h-8 text-purple-600" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No KPIs Assigned</h3>
                        <p className="text-slate-500">You don't have any KPIs assigned yet. Contact your manager to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {kpis.map(kpi => {
                            const variance = calculateVariance(kpi);
                            const isPositive = variance >= 0;

                            return (
                                <div key={kpi.id} className="glass-card overflow-hidden">
                                    {/* KPI Header */}
                                    <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{kpi.name}</h3>
                                                {kpi.kraTitle && (
                                                    <p className="text-sm text-slate-500">KRA: {kpi.kraTitle}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="badge badge-primary">
                                                    Benchmark: {kpi.benchmark}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* KPI Input Grid */}
                                    <div className="p-6">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            {/* Last Week Actual */}
                                            <div className="space-y-2">
                                                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">
                                                    Last Week Actual
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={getValue(kpi, 'lastWeekActual')}
                                                        onChange={e => handleInputChange(kpi.id, 'lastWeekActual', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-semibold"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                                </div>
                                            </div>

                                            {/* Current Week Planned */}
                                            <div className="space-y-2">
                                                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">
                                                    This Week Planned
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={getValue(kpi, 'currentWeekPlanned')}
                                                        onChange={e => handleInputChange(kpi.id, 'currentWeekPlanned', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-semibold"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                                </div>
                                            </div>

                                            {/* Current Week Actual */}
                                            <div className="space-y-2">
                                                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">
                                                    This Week Actual
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={getValue(kpi, 'currentWeekActual')}
                                                        onChange={e => handleInputChange(kpi.id, 'currentWeekActual', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-semibold"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                                </div>
                                            </div>

                                            {/* Next Week Target */}
                                            <div className="space-y-2">
                                                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">
                                                    Next Week Target
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={getValue(kpi, 'nextWeekTarget')}
                                                        onChange={e => handleInputChange(kpi.id, 'nextWeekTarget', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-semibold"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Variance Indicator */}
                                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-slate-500">Weekly Variance:</span>
                                                <span className={`flex items-center gap-1 font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {isPositive ? (
                                                        <TrendingUp className="w-4 h-4" />
                                                    ) : (
                                                        <TrendingDown className="w-4 h-4" />
                                                    )}
                                                    {isPositive ? '+' : ''}{variance}%
                                                </span>
                                            </div>

                                            {/* Previous Week Commitment */}
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Previous week commitment notes..."
                                                    value={editedKpis[kpi.id]?.previousWeekCommitment ?? kpi.previousWeekCommitment ?? ''}
                                                    onChange={e => handleInputChange(kpi.id, 'previousWeekCommitment', e.target.value)}
                                                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}

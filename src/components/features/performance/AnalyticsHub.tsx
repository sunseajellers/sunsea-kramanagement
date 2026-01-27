'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { authenticatedJsonFetch } from '@/lib/apiClient'
import { BarChart3, Users, Target, Download, FileText, PieChart, Activity, TrendingUp, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AnalyticsHub() {
    const { user, loading: authLoading } = useAuth()
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'reports'>('overview')
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        if (!authLoading && user) {
            loadAnalytics()
        }
    }, [authLoading, user])

    const loadAnalytics = async () => {
        if (!user) return
        try {
            setLoading(true)
            const result = await authenticatedJsonFetch('/api/analytics', {
                headers: {
                    'x-user-id': user.uid
                }
            })
            if (result.success && result.data) {
                setAnalytics(result.data)
            } else {
                throw new Error(result.error || 'Failed to load analytics')
            }
        } catch (error) {
            console.error('Failed to load analytics', error)
        } finally {
            setLoading(false)
        }
    }

    const exportReport = async (reportType: string) => {
        if (!user) return
        try {
            const result = await authenticatedJsonFetch('/api/analytics/reports', {
                method: 'POST',
                body: JSON.stringify({ reportType }),
                headers: {
                    'x-user-id': user.uid
                }
            });
            if (result.success && result.data) {
                const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Failed to export report', error);
        }
    }

    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center animate-pulse">
                        <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Loading analytics...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in">
            {/* Header */}
            <div className="page-header flex items-center justify-between">
                <div>
                    <h2 className="section-title">Performance Intelligence</h2>
                    <p className="section-subtitle">Real-time metrics and system-wide strategic insights</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Inner Tabs for better organization within analytics */}
                    <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200/60">
                        {[
                            { id: 'overview', label: 'Overview', icon: Activity },
                            { id: 'teams', label: 'Teams', icon: Users },
                            { id: 'reports', label: 'Reports', icon: FileText }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    activeTab === tab.id
                                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                                        : 'text-slate-400 hover:text-slate-600'
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <Button variant="outline" onClick={loadAnalytics} className="h-11 w-11 p-0 rounded-2xl border-slate-200/60 bg-white hover:bg-slate-50 transition-colors shadow-sm">
                        <RefreshCw className="w-5 h-5 text-slate-500" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'overview' && analytics && (
                <div className="space-y-10">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Personnel', value: analytics.overview.totalUsers, color: 'text-blue-600', bg: 'bg-blue-50/50' },
                            { label: 'Active Missions', value: analytics.overview.totalTasks, sub: `${analytics.overview.completedTasks} SUCCESS`, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
                            { label: 'Execution Rate', value: `${analytics.overview.overallCompletionRate}%`, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
                            { label: 'KRA Density', value: analytics.overview.activeKRAs, color: 'text-rose-600', bg: 'bg-rose-50/50' }
                        ].map((stat, i) => (
                            <div key={i} className="dashboard-card group">
                                <div className="flex flex-col gap-1.5">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">{stat.label}</p>
                                    <h3 className={cn("text-3xl font-black tracking-tight transition-colors", stat.color)}>{stat.value}</h3>
                                    {stat.sub && (
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.sub}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Priority Distribution */}
                        <div className="glass-panel p-8 flex flex-col h-[450px]">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 rounded-xl">
                                        <PieChart className="w-4 h-4 text-blue-500" />
                                    </div>
                                    Priority Allocation
                                </h3>
                            </div>
                            <div className="flex-1 min-h-0">
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={Object.entries(analytics.distributions.priority).map(([key, value]) => ({
                                                    name: key.charAt(0).toUpperCase() + key.slice(1),
                                                    value
                                                }))}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius="80%"
                                                innerRadius="65%"
                                                stroke="none"
                                                dataKey="value"
                                                paddingAngle={8}
                                            >
                                                {Object.entries(analytics.distributions.priority).map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '20px' }}
                                                itemStyle={{ fontWeight: 800, fontSize: '12px', textTransform: 'uppercase' }}
                                            />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-8 mt-6">
                                {Object.entries(analytics.distributions.priority).map(([key], index) => (
                                    <div key={key} className="flex items-center gap-2.5">
                                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{key}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* KRA Types Distribution */}
                        <div className="glass-panel p-8 flex flex-col h-[450px]">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 rounded-xl">
                                        <Target className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    KRA Frequency
                                </h3>
                            </div>
                            <div className="flex-1 min-h-0">
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={Object.entries(analytics.distributions.kraTypes).map(([key, value]) => ({
                                                name: key.charAt(0).toUpperCase() + key.slice(1),
                                                value
                                            }))}
                                            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                                        >
                                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }}
                                                dy={15}
                                            />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(59, 130, 246, 0.03)' }}
                                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '20px' }}
                                            />
                                            <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={48} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Team Performance Table */}
                    <div className="glass-panel p-0 flex flex-col overflow-hidden max-h-[600px]">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Departmental Efficiency Ledger</h3>
                            <Button variant="ghost" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-slate-50">
                                Expand Registry
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/50 sticky top-0 z-10">
                                    <tr className="border-b border-slate-100">
                                        <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Department identity</th>
                                        <th className="px-8 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Force Matrix</th>
                                        <th className="px-8 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Success Delta</th>
                                        <th className="px-8 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Efficiency Rating</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {analytics.teamPerformance.map((team: any) => (
                                        <tr key={team.teamId} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                                        <Users className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                                    </div>
                                                    <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{team.teamName}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="status-badge status-badge-info">{team.memberCount} PERSONNEL</span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-black text-slate-900">{team.completedTasks} / {team.totalTasks}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tasks Finalized</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center justify-center gap-4">
                                                    <div className="w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                                                        <div
                                                            className={cn(
                                                                "h-full rounded-full shadow-sm transition-all duration-1000",
                                                                team.completionRate >= 80 ? 'bg-emerald-500' : team.completionRate >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                                            )}
                                                            style={{ width: `${team.completionRate}%` }}
                                                        />
                                                    </div>
                                                    <span className={cn(
                                                        "text-[11px] font-black w-12",
                                                        team.completionRate >= 80 ? 'text-emerald-500' : team.completionRate >= 60 ? 'text-amber-500' : 'text-rose-500'
                                                    )}>
                                                        {team.completionRate}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'teams' && analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                    {analytics.teamPerformance.map((team: any) => (
                        <div key={team.teamId} className="glass-panel-hover p-8 group flex flex-col h-full bg-white">
                            <div className="flex items-start justify-between mb-8">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{team.teamName}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Operational Unit</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                                    <Users className="w-7 h-7" />
                                </div>
                            </div>

                            <div className="space-y-6 mt-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Force size</p>
                                        <p className="text-xl font-black text-slate-900 leading-none">{team.memberCount}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Execution</p>
                                        <p className="text-xl font-black text-slate-900 leading-none">{team.completedTasks} / <span className="text-slate-400 text-sm">{team.totalTasks}</span></p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency Rating</span>
                                        <span className={cn(
                                            "status-badge",
                                            team.completionRate >= 80 ? 'status-badge-success' : team.completionRate >= 60 ? 'status-badge-warning' : 'status-badge-danger'
                                        )}>
                                            {team.completionRate}%
                                        </span>
                                    </div>
                                    <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5 shadow-inner">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-1000 shadow-sm",
                                                team.completionRate >= 80 ? 'bg-emerald-400' : team.completionRate >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                                            )}
                                            style={{ width: `${team.completionRate}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'reports' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
                    {[
                        { type: 'overview', title: 'Executive Data Snapshot', description: 'Comprehensive system analytics and executive-level performance metrics for key stakeholders.', color: 'from-blue-500 to-blue-600', icon: Activity },
                        { type: 'teams', title: 'Department Comparison', description: 'Cross-functional comparative analysis of departmental efficiency and execution velocity.', color: 'from-indigo-500 to-indigo-600', icon: Users },
                        { type: 'users', title: 'Human Capital Audit', description: 'Individual performance profiling, task execution records, and professional accountability tracking.', color: 'from-purple-500 to-purple-600', icon: Target },
                        { type: 'performance', title: 'Strategic Trend Analysis', description: 'Long-term operational trends, predictive forecasting data, and system health visualization.', color: 'from-slate-800 to-slate-900', icon: TrendingUp }
                    ].map(report => (
                        <div key={report.type} className="glass-panel-hover p-10 group flex flex-col bg-white overflow-hidden relative">
                            <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br blur-3xl opacity-5 transition-all duration-700 group-hover:opacity-20", report.color)} />

                            <div className="flex items-start justify-between mb-8">
                                <div className={cn("p-4 rounded-2xl text-white shadow-xl shadow-slate-100 transition-all duration-500 group-hover:-translate-y-1 bg-gradient-to-br", report.color)}>
                                    <report.icon className="w-8 h-8" />
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-300 group-hover:text-indigo-600 group-hover:border-indigo-100 group-hover:bg-indigo-50 transition-all duration-500">
                                    <Download className="w-5 h-5" />
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight">{report.title}</h3>
                            <p className="text-sm text-slate-500 font-medium mb-10 flex-1 leading-relaxed">{report.description}</p>

                            <Button
                                onClick={() => exportReport(report.type)}
                                className="w-full h-14 bg-white hover:bg-slate-900 text-slate-900 hover:text-white border-2 border-slate-100 hover:border-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 shadow-sm"
                            >
                                Decompile & Export
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { authenticatedJsonFetch } from '@/lib/apiClient'
import { BarChart3, Users, Target, Download, FileText, PieChart, Activity, TrendingUp, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts'
import { Button } from '@/components/ui/button'

export default function AnalyticsHub() {
    const { user, loading: authLoading } = useAuth()
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'reports'>('overview')

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Performance Intelligence</h2>
                    <p className="text-gray-400 text-xs font-medium">Real-time metrics and system-wide insights</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Inner Tabs for better organization within analytics */}
                    <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-100">
                        {[
                            { id: 'overview', label: 'Overview', icon: Activity },
                            { id: 'teams', label: 'Teams', icon: Users },
                            { id: 'reports', label: 'Reports', icon: FileText }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <Button variant="outline" onClick={loadAnalytics} className="h-9 w-9 p-0 rounded-xl border-gray-200 ml-2">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'overview' && analytics && (
                <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Users', value: analytics.overview.totalUsers, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Total Tasks', value: analytics.overview.totalTasks, sub: `${analytics.overview.completedTasks} completed`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Completion Rate', value: `${analytics.overview.overallCompletionRate}%`, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { label: 'Active KRAs', value: analytics.overview.activeKRAs, color: 'text-rose-600', bg: 'bg-rose-50' }
                        ].map((stat, i) => (
                            <div key={i} className="stat-card">
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{stat.label}</p>
                                    <h3 className={`text-2xl font-bold ${stat.color}`}>{stat.value}</h3>
                                    {stat.sub && <p className="text-[10px] text-gray-400">{stat.sub}</p>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Priority Distribution */}
                        <div className="glass-card p-6 flex flex-col h-[400px]">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <PieChart className="w-4 h-4 text-blue-500" />
                                    Priority Distribution
                                </h3>
                            </div>
                            <div className="flex-1 min-h-0">
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
                                            innerRadius="60%"
                                            stroke="none"
                                            dataKey="value"
                                            paddingAngle={4}
                                        >
                                            {Object.entries(analytics.distributions.priority).map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '12px' }}
                                        />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-6 mt-4">
                                {Object.entries(analytics.distributions.priority).map(([key], index) => (
                                    <div key={key} className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{key}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* KRA Types Distribution */}
                        <div className="glass-card p-6 flex flex-col h-[400px]">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Target className="w-4 h-4 text-emerald-500" />
                                    KRA Frequency
                                </h3>
                            </div>
                            <div className="flex-1 min-h-0">
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
                                            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                                            dy={10}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '12px' }}
                                        />
                                        <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Team Performance Table */}
                    <div className="glass-card p-0 flex flex-col overflow-hidden h-[400px]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Team Performance Registry</h3>
                        </div>
                        <div className="scroll-panel flex-1">
                            <table className="data-table">
                                <thead className="sticky top-0 bg-white shadow-sm z-10">
                                    <tr>
                                        <th>Team Identity</th>
                                        <th className="text-center">Force Size</th>
                                        <th className="text-center">Execution Delta</th>
                                        <th className="text-center">Efficiency Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.teamPerformance.map((team: any) => (
                                        <tr key={team.teamId} className="hover:bg-gray-50/50">
                                            <td className="font-bold text-gray-900">{team.teamName}</td>
                                            <td className="text-center text-gray-500 font-medium">{team.memberCount} Members</td>
                                            <td className="text-center font-bold">{team.completedTasks}/{team.totalTasks}</td>
                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${team.completionRate >= 80 ? 'bg-green-500' : team.completionRate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                            style={{ width: `${team.completionRate}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-black w-10 ${team.completionRate >= 80 ? 'text-green-600' : team.completionRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {analytics.teamPerformance.map((team: any) => (
                        <div key={team.teamId} className="module-card group hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">{team.teamName}</h3>
                                <div className="icon-box icon-box-md bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                    <Users className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold text-gray-400 uppercase tracking-wide">Force Size</span>
                                    <span className="font-black text-gray-900">{team.memberCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold text-gray-400 uppercase tracking-wide">Execution Delta</span>
                                    <span className="font-black text-gray-900">{team.completedTasks} / {team.totalTasks}</span>
                                </div>
                                <div className="pt-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Efficiency</span>
                                        <span className={`text-sm font-black ${team.completionRate >= 80 ? 'text-green-600' : team.completionRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                            {team.completionRate}%
                                        </span>
                                    </div>
                                    <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5 shadow-inner">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${team.completionRate >= 80 ? 'bg-green-500' : team.completionRate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { type: 'overview', title: 'Executive Data Snapshot', description: 'Complete system analytics and high-level KPIs for stakeholders.', color: 'bg-blue-600', icon: Activity },
                        { type: 'teams', title: 'Department Comparison', description: 'Comparative analysis of team performance and efficiency metrics.', color: 'bg-indigo-600', icon: Users },
                        { type: 'users', title: 'Human Capital Audit', description: 'Individual performance profiling and task execution records.', color: 'bg-purple-600', icon: Target },
                        { type: 'performance', title: 'Strategic Trend Analysis', description: 'Long-term performance trends and forecasting data.', color: 'bg-gray-900', icon: TrendingUp }
                    ].map(report => (
                        <div key={report.type} className="module-card group flex flex-col p-8 bg-white border border-gray-100 rounded-[2rem] hover:border-purple-200 transition-all duration-500">
                            <div className="flex items-start justify-between mb-8">
                                <div className={`icon-box icon-box-lg ${report.color} text-white shadow-xl rotate-0 group-hover:-rotate-12 transition-all duration-500`}>
                                    <report.icon className="w-6 h-6" />
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-purple-50 transition-colors">
                                    <Download className="w-4 h-4 text-gray-300 group-hover:text-purple-500" />
                                </div>
                            </div>
                            <h3 className="text-lg font-black text-gray-900 mb-2">{report.title}</h3>
                            <p className="text-sm text-gray-400 mb-8 flex-1 leading-relaxed">{report.description}</p>
                            <Button
                                onClick={() => exportReport(report.type)}
                                className="w-full h-12 bg-white hover:bg-gray-900 text-gray-900 hover:text-white border-2 border-gray-100 hover:border-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300"
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

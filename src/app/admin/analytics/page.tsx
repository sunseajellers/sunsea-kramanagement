'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { authenticatedJsonFetch } from '@/lib/apiClient'
import { BarChart3, Users, Target, Download, FileText, PieChart, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Area, AreaChart, Pie } from 'recharts'
import { Button } from '@/components/ui/button'
// Analytics page without card imports as custom divs are used

export default function AdminAnalyticsPage() {
    const { user } = useAuth()
    const [analytics, setAnalytics] = useState<any>(null)
    const [teamDetails, setTeamDetails] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'users' | 'reports'>('overview')

    useEffect(() => {
        loadAnalytics()
    }, [])

    const loadAnalytics = async () => {
        try {
            setLoading(true)
            const result = await authenticatedJsonFetch('/api/analytics', {
                headers: {
                    'x-user-id': user!.uid
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

    const loadTeamDetails = async (teamId: string) => {
        try {
            const result = await authenticatedJsonFetch(`/api/analytics?type=team&teamId=${teamId}`, {
                headers: {
                    'x-user-id': user!.uid
                }
            })
            if (result.success && result.data) {
                setTeamDetails(result.data)
            } else {
                throw new Error(result.error || 'Failed to load team details')
            }
        } catch (error) {
            console.error('Failed to load team details', error)
        }
    }

    const exportReport = async (reportType: string) => {
        try {
            const result = await authenticatedJsonFetch('/api/analytics/reports', {
                method: 'POST',
                body: JSON.stringify({ reportType }),
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
            } else {
                throw new Error(result.error || 'Failed to export report');
            }
        } catch (error) {
            console.error('Failed to export report', error);
        }
    }


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']

    return (
        <div className="space-y-10 pb-12">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Strategic Intelligence</h1>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                        <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
                        Performance analytics & reporting
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => loadAnalytics()}
                        className="h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                    >
                        <Activity className="h-4 w-4 mr-3" />
                        Refresh Engine
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 p-1.5 bg-gray-50 rounded-3xl w-fit">
                {[
                    { id: 'overview', label: 'OVERVIEW', icon: Activity },
                    { id: 'teams', label: 'TEAMS', icon: Users },
                    { id: 'users', label: 'USERS', icon: Target },
                    { id: 'reports', label: 'REPORTS', icon: FileText }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[10px] font-black tracking-widest transition-all ${activeTab === tab.id
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content based on active tab */}
            {activeTab === 'overview' && analytics && (
                <div className="space-y-10">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'TOTAL PERSONNEL', value: analytics.overview.totalUsers, sub: 'ACTIVE NODES', color: 'text-blue-600' },
                            { label: 'TOTAL OBJECTIVES', value: analytics.overview.totalTasks, sub: `${analytics.overview.completedTasks} SUCCESSFUL`, color: 'text-emerald-600' },
                            { label: 'EFFICIENCY RATE', value: `${analytics.overview.overallCompletionRate}%`, sub: 'GLOBAL PERFORMANCE', color: 'text-indigo-600' },
                            { label: 'ACTIVE PROTOCOLS', value: analytics.overview.activeKRAs, sub: 'STRATEGIC GOALS', color: 'text-rose-600' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm group hover:ring-2 hover:ring-blue-50 transition-all">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{stat.label}</p>
                                <p className={`text-4xl font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
                                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-2">{stat.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Charts Layer */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                                <PieChart className="w-4 h-4 text-blue-500" />
                                OBJECTIVE PRIORITY MATRIX
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsPieChart>
                                    <Pie
                                        data={Object.entries(analytics.distributions.priority).map(([key, value]) => ({
                                            name: key.toUpperCase(),
                                            value
                                        }))}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={110}
                                        innerRadius={75}
                                        stroke="none"
                                        dataKey="value"
                                        paddingAngle={8}
                                    >
                                        {Object.entries(analytics.distributions.priority).map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', padding: '20px' }}
                                    />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-3 gap-4 mt-8">
                                {Object.entries(analytics.distributions.priority).map(([key], index) => (
                                    <div key={key} className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-900">{key}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                                <Target className="w-4 h-4 text-emerald-500" />
                                PROTOCOL SEGMENTATION
                            </h3>
                            <ResponsiveContainer width="100%" height={340}>
                                <BarChart data={Object.entries(analytics.distributions.kraTypes).map(([key, value]) => ({
                                    name: key.toUpperCase(),
                                    value
                                }))} margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94A3B8' }} dy={20} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94A3B8' }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(59, 130, 246, 0.03)' }}
                                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', padding: '20px' }}
                                    />
                                    <Bar dataKey="value" fill="#3B82F6" radius={[12, 12, 0, 0]} barSize={45} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Team Performance Inventory */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Team Efficiency Log</h2>
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-50 bg-gray-50/30">
                                        <th className="text-left py-6 px-10 text-[9px] font-black text-gray-400 uppercase tracking-widest">TEAM IDENTIFIER</th>
                                        <th className="text-center py-6 px-10 text-[9px] font-black text-gray-400 uppercase tracking-widest">NODES</th>
                                        <th className="text-center py-6 px-10 text-[9px] font-black text-gray-400 uppercase tracking-widest">THROUGHPUT</th>
                                        <th className="text-center py-6 px-10 text-[9px] font-black text-gray-400 uppercase tracking-widest">SUCCESS RATE</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {analytics.teamPerformance.map((team: any) => (
                                        <tr key={team.teamId} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-6 px-10">
                                                <div className="text-sm font-black text-gray-900 uppercase tracking-tighter">{team.teamName}</div>
                                            </td>
                                            <td className="py-6 px-10 text-center text-[10px] font-black text-gray-400">{team.memberCount}</td>
                                            <td className="py-6 px-10 text-center text-[10px] font-black text-gray-900">{team.totalTasks} UNITS</td>
                                            <td className="py-6 px-10 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${team.completionRate >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        team.completionRate >= 60 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            'bg-rose-50 text-rose-600 border-rose-100'
                                                        }`}>
                                                        {team.completionRate}% ACCURACY
                                                    </span>
                                                    <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className={`h-full transition-all duration-700 ${team.completionRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                                                            }`} style={{ width: `${team.completionRate}%` }} />
                                                    </div>
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
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {analytics.teamPerformance.map((team: any) => (
                            <div
                                key={team.teamId}
                                onClick={() => loadTeamDetails(team.teamId)}
                                className="group bg-white rounded-[2.5rem] border border-gray-100 p-8 hover:shadow-2xl hover:ring-4 hover:ring-blue-50/50 cursor-pointer transition-all duration-500"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase">{team.teamName}</h3>
                                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <Users className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">THROUGHPUT</p>
                                        <p className="text-lg font-black text-gray-900 tracking-tighter">{team.completedTasks} / {team.totalTasks}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ACCURACY</p>
                                            <p className="text-lg font-black text-blue-600 tracking-tighter">{team.completionRate}%</p>
                                        </div>
                                        <div className="w-full bg-gray-50 rounded-full h-2.5 p-0.5 overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                                                style={{ width: `${team.completionRate}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {teamDetails && (
                        <div className="bg-white border border-gray-100 rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{teamDetails.teamInfo.name} Core Logistics</h2>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Detailed performance diagnostic</p>
                                </div>
                                <button
                                    onClick={() => setTeamDetails(null)}
                                    className="w-12 h-12 rounded-2xl bg-white text-gray-400 hover:text-rose-600 shadow-sm flex items-center justify-center transition-all hover:rotate-90"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="p-10">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100/50">
                                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-4">TOTAL UNITS</p>
                                            <div className="text-5xl font-black text-blue-600 tracking-tighter">{teamDetails.performance.totalTasks}</div>
                                        </div>
                                        <div className="bg-emerald-50/50 p-8 rounded-[2rem] border border-emerald-100/50">
                                            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-4">AVG ACCURACY</p>
                                            <div className="text-5xl font-black text-emerald-600 tracking-tighter">{teamDetails.performance.completionRate}%</div>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-gray-100 p-8 rounded-[2rem] shadow-sm">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-8">VELOCITY TREND</p>
                                        <ResponsiveContainer width="100%" height={160}>
                                            <AreaChart data={teamDetails.weeklyProgress}>
                                                <defs>
                                                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#F1F5F9" />
                                                <XAxis dataKey="week" hide />
                                                <YAxis hide />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px' }}
                                                />
                                                <Area type="monotone" dataKey="completionRate" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorRate)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Node Performance Log</h3>
                                    <div className="overflow-hidden rounded-[2rem] border border-gray-50 text-[10px] font-black">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-50 bg-gray-50/30">
                                                    <th className="text-left py-5 px-8 text-gray-400 uppercase tracking-widest">IDENTIFIER</th>
                                                    <th className="text-center py-5 px-8 text-gray-400 uppercase tracking-widest">RANK</th>
                                                    <th className="text-center py-5 px-8 text-gray-400 uppercase tracking-widest">THROUGHPUT</th>
                                                    <th className="text-center py-5 px-8 text-gray-400 uppercase tracking-widest">ACCURACY</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {teamDetails.memberPerformance.map((member: any) => (
                                                    <tr key={member.userId} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="py-5 px-8">
                                                            <div className="text-gray-900 uppercase tracking-tight">{member.userName}</div>
                                                        </td>
                                                        <td className="py-5 px-8 text-center text-gray-400 uppercase">{member.role}</td>
                                                        <td className="py-6 px-10 text-center text-gray-900">
                                                            {member.tasksCompleted} / {member.tasksAssigned}
                                                        </td>
                                                        <td className="py-5 px-8 text-center">
                                                            <span className={`px-4 py-1 rounded-lg border ${member.completionRate >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                member.completionRate >= 60 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                    'bg-rose-50 text-rose-600 border-rose-100'
                                                                }`}>
                                                                {member.completionRate}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'users' && analytics && (
                <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                    <table className="w-full text-[10px] font-black uppercase">
                        <thead>
                            <tr className="border-b border-gray-50 bg-gray-50/30">
                                <th className="text-left py-6 px-10 text-gray-400 tracking-widest">IDENTIFIER</th>
                                <th className="text-center py-6 px-10 text-gray-400 tracking-widest">SECTOR</th>
                                <th className="text-center py-6 px-10 text-gray-400 tracking-widest">RANK</th>
                                <th className="text-center py-6 px-10 text-gray-400 tracking-widest">THROUGHPUT</th>
                                <th className="text-center py-6 px-10 text-gray-400 tracking-widest">ACCURACY</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {analytics.userPerformance.map((user: any) => (
                                <tr key={user.userId} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-6 px-10">
                                        <div className="text-gray-900 tracking-tight">{user.userName}</div>
                                    </td>
                                    <td className="py-6 px-10 text-center text-gray-400 tracking-tighter">{user.teamName}</td>
                                    <td className="py-6 px-10 text-center">
                                        <span className={`px-4 py-1 rounded-lg border ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                            user.role === 'manager' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                'bg-gray-50 text-gray-400 border-gray-100'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-6 px-10 text-center text-gray-900">
                                        {user.completedTasks} / {user.totalTasks}
                                    </td>
                                    <td className="py-6 px-10 text-center">
                                        <span className={`px-4 py-1.5 rounded-xl border ${user.completionRate >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            user.completionRate >= 60 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-rose-50 text-rose-600 border-rose-100'
                                            }`}>
                                            {user.completionRate}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'reports' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                        { type: 'overview', title: 'SNAPSHOT REPORT', description: 'COMPLETE SYSTEM PHENOTYPE MONITORING', color: 'bg-blue-600', sub: 'META ANALYSIS' },
                        { type: 'teams', title: 'LOGISTICS REPORT', description: 'COMPARATIVE SECTOR VELOCITY ANALYSIS', color: 'bg-indigo-600', sub: 'THROUGHPUT' },
                        { type: 'users', title: 'PERSONNEL REPORT', description: 'INDIVIDUAL PERFORMANCE AND AUDITS', color: 'bg-purple-600', sub: 'CONTRIBUTIONS' },
                        { type: 'performance', title: 'STRATEGY REPORT', description: 'LONG-TERM TREND FORECASTING', color: 'bg-gray-900', sub: 'FUTURE MAPPING' }
                    ].map(report => (
                        <div key={report.type} className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-sm hover:shadow-2xl hover:ring-2 hover:ring-blue-50 transition-all duration-500 flex flex-col justify-between group">
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="bg-gray-50 px-4 py-1 rounded-full">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">{report.sub}</span>
                                    </div>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${report.color} shadow-lg shadow-gray-200`}>
                                        <Download className="w-5 h-5" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{report.title}</h3>
                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-2">{report.description}</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => exportReport(report.type)}
                                className="mt-10 h-14 bg-gray-50 hover:bg-gray-900 hover:text-white text-gray-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all border-none"
                            >
                                GENERATE RAW EXPORT
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
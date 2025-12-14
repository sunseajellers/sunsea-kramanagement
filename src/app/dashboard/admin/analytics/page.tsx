'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAdminDashboardAnalytics, getTeamDetailedAnalytics } from '@/lib/analyticsService'
import { authenticatedJsonFetch } from '@/lib/apiClient'
import { userHasPermission } from '@/lib/rbacService'
import { BarChart3, Users, Target, TrendingUp, Download, FileText, PieChart, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart, Line, Area, AreaChart, Pie } from 'recharts'

export default function AdminAnalyticsPage() {
    const { user, userData } = useAuth()
    const [analytics, setAnalytics] = useState<any>(null)
    const [selectedTeam, setSelectedTeam] = useState<string>('')
    const [teamDetails, setTeamDetails] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'users' | 'reports'>('overview')
    const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null)

    useEffect(() => {
        const checkPermission = async () => {
            if (userData?.uid) {
                try {
                    const hasAccess = await userHasPermission(userData.uid, 'admin', 'access')
                    setHasAdminAccess(hasAccess)
                    if (hasAccess) {
                        loadAnalytics()
                    } else {
                        setLoading(false)
                    }
                } catch (error) {
                    console.error('Error checking admin permission:', error)
                    setHasAdminAccess(false)
                    setLoading(false)
                }
            }
        }
        checkPermission()
    }, [userData])

    const loadAnalytics = async () => {
        try {
            setLoading(true)
            const result = await authenticatedJsonFetch('/api/analytics')
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
            const result = await authenticatedJsonFetch(`/api/analytics?type=team&teamId=${teamId}`)
            if (result.success && result.data) {
                setTeamDetails(result.data)
                setSelectedTeam(teamId)
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

    // Restrict access to admins only
    if (hasAdminAccess === false) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                    <p className="text-gray-600">This page is only accessible to administrators.</p>
                </div>
            </div>
        )
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
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-6 text-white">
                <h1 className="text-3xl font-bold flex items-center">
                    <BarChart3 className="w-8 h-8 mr-3" />
                    Admin Analytics Dashboard
                </h1>
                <p className="text-primary-100 mt-2">Comprehensive insights into team performance and productivity</p>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex space-x-2">
                {[
                    { id: 'overview', label: 'Overview', icon: Activity },
                    { id: 'teams', label: 'Teams', icon: Users },
                    { id: 'users', label: 'Users', icon: Target },
                    { id: 'reports', label: 'Reports', icon: FileText }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                            activeTab === tab.id
                                ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <tab.icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content based on active tab */}
            {activeTab === 'overview' && analytics && (
                <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200/50 shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                                <span className="text-3xl font-bold text-gray-900">{analytics.overview.totalUsers}</span>
                            </div>
                            <h3 className="text-sm font-semibold text-blue-700 mb-1">Total Users</h3>
                            <p className="text-xs text-blue-600">Across all teams</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50 shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <Target className="w-7 h-7 text-white" />
                                </div>
                                <span className="text-3xl font-bold text-gray-900">{analytics.overview.totalTasks}</span>
                            </div>
                            <h3 className="text-sm font-semibold text-green-700 mb-1">Total Tasks</h3>
                            <p className="text-xs text-green-600">{analytics.overview.completedTasks} completed</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200/50 shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <BarChart3 className="w-7 h-7 text-white" />
                                </div>
                                <span className="text-3xl font-bold text-gray-900">{analytics.overview.overallCompletionRate}%</span>
                            </div>
                            <h3 className="text-sm font-semibold text-purple-700 mb-1">Completion Rate</h3>
                            <p className="text-xs text-purple-600">Overall performance</p>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200/50 shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <TrendingUp className="w-7 h-7 text-white" />
                                </div>
                                <span className="text-3xl font-bold text-gray-900">{analytics.overview.activeKRAs}</span>
                            </div>
                            <h3 className="text-sm font-semibold text-orange-700 mb-1">Active KRAs</h3>
                            <p className="text-xs text-orange-600">Goals in progress</p>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Priority Distribution */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <PieChart className="w-5 h-5 mr-2 text-primary-600" />
                                Task Priority Distribution
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsPieChart>
                                    <Pie
                                        data={Object.entries(analytics.distributions.priority).map(([key, value]) => ({
                                            name: key.charAt(0).toUpperCase() + key.slice(1),
                                            value
                                        }))}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }: any) => `${name || ''} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {Object.entries(analytics.distributions.priority).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* KRA Type Distribution */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <Target className="w-5 h-5 mr-2 text-secondary-600" />
                                KRA Type Distribution
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={Object.entries(analytics.distributions.kraTypes).map(([key, value]) => ({
                                    name: key.charAt(0).toUpperCase() + key.slice(1),
                                    value
                                }))}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#8B5CF6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Team Performance Overview */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <Users className="w-5 h-5 mr-2 text-success-600" />
                            Team Performance Overview
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Team</th>
                                        <th className="text-center py-3 px-4 font-semibold text-gray-900">Members</th>
                                        <th className="text-center py-3 px-4 font-semibold text-gray-900">Tasks</th>
                                        <th className="text-center py-3 px-4 font-semibold text-gray-900">Completion</th>
                                        <th className="text-center py-3 px-4 font-semibold text-gray-900">Active KRAs</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.teamPerformance.map((team: any) => (
                                        <tr key={team.teamId} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 font-medium text-gray-900">{team.teamName}</td>
                                            <td className="py-3 px-4 text-center text-gray-600">{team.memberCount}</td>
                                            <td className="py-3 px-4 text-center text-gray-600">{team.totalTasks}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    team.completionRate >= 80 ? 'bg-green-100 text-green-700' :
                                                    team.completionRate >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {team.completionRate}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center text-gray-600">{team.activeKRAs}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'teams' && analytics && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analytics.teamPerformance.map((team: any) => (
                            <div
                                key={team.teamId}
                                onClick={() => loadTeamDetails(team.teamId)}
                                className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:border-primary-200 cursor-pointer transition-all"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">{team.teamName}</h3>
                                    <span className="text-sm text-gray-500">{team.memberCount} members</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Tasks:</span>
                                        <span className="font-semibold">{team.completedTasks}/{team.totalTasks}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Completion:</span>
                                        <span className="font-semibold text-primary-600">{team.completionRate}%</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Active KRAs:</span>
                                        <span className="font-semibold">{team.activeKRAs}</span>
                                    </div>
                                </div>
                                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${team.completionRate}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {teamDetails && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">{teamDetails.teamInfo.name} - Detailed Analytics</h2>
                                <button
                                    onClick={() => setTeamDetails(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Team Overview</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">{teamDetails.performance.totalTasks}</div>
                                            <div className="text-sm text-blue-600">Total Tasks</div>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">{teamDetails.performance.completionRate}%</div>
                                            <div className="text-sm text-green-600">Completion Rate</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Weekly Progress</h3>
                                    <ResponsiveContainer width="100%" height={150}>
                                        <AreaChart data={teamDetails.weeklyProgress}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="week" />
                                            <YAxis />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="completionRate" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Member Performance</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 font-semibold text-gray-900">Member</th>
                                                <th className="text-center py-3 px-4 font-semibold text-gray-900">Tasks</th>
                                                <th className="text-center py-3 px-4 font-semibold text-gray-900">Completion</th>
                                                <th className="text-center py-3 px-4 font-semibold text-gray-900">KRAs</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {teamDetails.memberPerformance.map((member: any) => (
                                                <tr key={member.userId} className="border-b border-gray-100">
                                                    <td className="py-3 px-4">
                                                        <div>
                                                            <div className="font-medium text-gray-900">{member.userName}</div>
                                                            <div className="text-sm text-gray-500">{member.role}</div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-gray-600">
                                                        {member.tasksCompleted}/{member.tasksAssigned}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                            member.completionRate >= 80 ? 'bg-green-100 text-green-700' :
                                                            member.completionRate >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                            {member.completionRate}%
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-gray-600">
                                                        {member.krasActive}/{member.krasAssigned}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'users' && analytics && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900">User Performance Analytics</h2>
                        <p className="text-gray-600 mt-1">Detailed breakdown of individual user performance</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="text-left py-4 px-6 font-semibold text-gray-900">User</th>
                                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Team</th>
                                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Role</th>
                                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Tasks</th>
                                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Completion</th>
                                    <th className="text-center py-4 px-6 font-semibold text-gray-900">KRAs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.userPerformance.map((user: any) => (
                                    <tr key={user.userId} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-4 px-6">
                                            <div className="font-medium text-gray-900">{user.userName}</div>
                                        </td>
                                        <td className="py-4 px-6 text-center text-gray-600">{user.teamName}</td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                user.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center text-gray-600">
                                            {user.completedTasks}/{user.totalTasks}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                user.completionRate >= 80 ? 'bg-green-100 text-green-700' :
                                                user.completionRate >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {user.completionRate}%
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center text-gray-600">
                                            {user.activeKRAs}/{user.totalKRAs}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'reports' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate Reports</h2>
                        <p className="text-gray-600 mb-6">Export comprehensive analytics reports for external analysis</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { type: 'overview', title: 'Overview Report', description: 'Complete system overview with key metrics' },
                                { type: 'teams', title: 'Team Performance Report', description: 'Detailed team-by-team performance analysis' },
                                { type: 'users', title: 'User Performance Report', description: 'Individual user performance metrics' },
                                { type: 'performance', title: 'Performance Insights', description: 'Trends and insights analysis' }
                            ].map(report => (
                                <div key={report.type} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{report.title}</h3>
                                            <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                                        </div>
                                        <button
                                            onClick={() => exportReport(report.type)}
                                            className="btn-primary flex items-center text-sm px-4 py-2"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Export
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
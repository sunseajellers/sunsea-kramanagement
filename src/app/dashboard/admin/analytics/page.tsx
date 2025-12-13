'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAllUsers } from '@/lib/userService'
import { getAllTeams } from '@/lib/teamService'
import { getAllTasks } from '@/lib/taskService'
import { getUserKRAs } from '@/lib/kraService'
import { getUserWeeklyReports } from '@/lib/reportService'
import { User, Team, Task, KRA, WeeklyReport } from '@/types'
import {
    BarChart3,
    Users,
    CheckCircle2,
    Target,
    TrendingUp,
    Award,
    Calendar,
    Activity,
    Loader2,
    Download,
    FileText
} from 'lucide-react'
import TaskStatusChart from '@/components/charts/TaskStatusChart'
import TaskPriorityChart from '@/components/charts/TaskPriorityChart'
import KRAProgressChart from '@/components/charts/KRAProgressChart'

export default function AdminAnalyticsPage() {
    const { userData } = useAuth()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<{
        users: User[]
        teams: Team[]
        tasks: Task[]
        kras: KRA[]
        reports: WeeklyReport[]
    } | null>(null)

    useEffect(() => {
        loadAnalyticsData()
    }, [])

    const loadAnalyticsData = async () => {
        setLoading(true)
        try {
            const [users, teams, tasks] = await Promise.all([
                getAllUsers(),
                getAllTeams(),
                getAllTasks()
            ])

            // For KRAs and reports, we'll use sample data for now since admin functions don't exist
            // In a real implementation, you'd create admin-level functions to fetch all data
            const sampleKRAs: KRA[] = []
            const sampleReports: WeeklyReport[] = []

            setData({ users, teams, tasks, kras: sampleKRAs, reports: sampleReports })
        } catch (error) {
            console.error('Failed to load analytics data', error)
        } finally {
            setLoading(false)
        }
    }

    const calculateMetrics = () => {
        if (!data) return null

        const { users, teams, tasks, kras, reports } = data

        // User metrics
        const totalUsers = users.length
        const adminCount = users.filter(u => u.role === 'admin').length
        const managerCount = users.filter(u => u.role === 'manager').length
        const employeeCount = users.filter(u => u.role === 'employee').length

        // Team metrics
        const totalTeams = teams.length
        const avgTeamSize = totalTeams > 0 ? Math.round(totalUsers / totalTeams) : 0

        // Task metrics
        const totalTasks = tasks.length
        const completedTasks = tasks.filter(t => t.status === 'completed').length
        const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
        const overdueTasks = tasks.filter(t => {
            const dueDate = new Date(t.dueDate)
            return dueDate < new Date() && t.status !== 'completed'
        }).length
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

        // KRA metrics
        const totalKRAs = kras.length
        const activeKRAs = kras.filter(k => k.status === 'in_progress').length
        const completedKRAs = kras.filter(k => k.status === 'completed').length

        // Report metrics
        const totalReports = reports.length
        const avgScore = reports.length > 0
            ? Math.round(reports.reduce((sum, r) => sum + r.score, 0) / reports.length)
            : 0

        // Recent activity (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentTasks = tasks.filter(t => new Date(t.createdAt) > thirtyDaysAgo).length
        const recentKRAs = kras.filter(k => new Date(k.createdAt) > thirtyDaysAgo).length
        const recentReports = reports.filter(r => new Date(r.generatedAt) > thirtyDaysAgo).length

        return {
            users: { totalUsers, adminCount, managerCount, employeeCount },
            teams: { totalTeams, avgTeamSize },
            tasks: { totalTasks, completedTasks, inProgressTasks, overdueTasks, completionRate },
            kras: { totalKRAs, activeKRAs, completedKRAs },
            reports: { totalReports, avgScore },
            activity: { recentTasks, recentKRAs, recentReports }
        }
    }

    const metrics = calculateMetrics()

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
            </div>
        )
    }

    if (!metrics || !data) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <p className="text-gray-500">Failed to load analytics data</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">System Analytics</h1>
                    <p className="text-gray-600">Comprehensive overview of your organization's performance</p>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Export Report</span>
                </button>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Users</h3>
                    <p className="text-2xl font-bold text-gray-900">{metrics.users.totalUsers}</p>
                    <div className="mt-2 text-xs text-gray-500">
                        <span className="text-blue-600">{metrics.users.adminCount} Admin</span> •
                        <span className="text-green-600 ml-1">{metrics.users.managerCount} Manager</span> •
                        <span className="text-purple-600 ml-1">{metrics.users.employeeCount} Employee</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Task Completion</h3>
                    <p className="text-2xl font-bold text-gray-900">{metrics.tasks.completionRate}%</p>
                    <div className="mt-2 text-xs text-gray-500">
                        {metrics.tasks.completedTasks} of {metrics.tasks.totalTasks} completed
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Active KRAs</h3>
                    <p className="text-2xl font-bold text-gray-900">{metrics.kras.activeKRAs}</p>
                    <div className="mt-2 text-xs text-gray-500">
                        {metrics.kras.completedKRAs} completed • {metrics.kras.totalKRAs} total
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                            <Award className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Avg Performance</h3>
                    <p className="text-2xl font-bold text-gray-900">{metrics.reports.avgScore}%</p>
                    <div className="mt-2 text-xs text-gray-500">
                        Based on {metrics.reports.totalReports} reports
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Task Status Distribution</h2>
                    <TaskStatusChart data={{
                        pending: data.tasks.filter(t => t.status === 'assigned').length,
                        'in-progress': data.tasks.filter(t => t.status === 'in_progress').length,
                        completed: data.tasks.filter(t => t.status === 'completed').length,
                        blocked: data.tasks.filter(t => t.status === 'blocked').length
                    }} />
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Task Priority Breakdown</h2>
                    <TaskPriorityChart data={{
                        low: data.tasks.filter(t => t.priority === 'low').length,
                        medium: data.tasks.filter(t => t.priority === 'medium').length,
                        high: data.tasks.filter(t => t.priority === 'high').length,
                        urgent: data.tasks.filter(t => t.priority === 'critical').length
                    }} />
                </div>
            </div>

            {/* KRA Progress Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">KRA Progress Overview</h2>
                <KRAProgressChart data={data.kras.map(kra => ({
                    id: kra.id,
                    title: kra.title,
                    progress: Math.round(Math.random() * 100), // Placeholder - would need actual progress calculation
                    tasksCompleted: Math.round(Math.random() * 10), // Placeholder
                    tasksTotal: Math.round(Math.random() * 15) // Placeholder
                }))} />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity (Last 30 Days)</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{metrics.activity.recentTasks}</h3>
                        <p className="text-sm text-gray-600">New Tasks Created</p>
                    </div>

                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Target className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{metrics.activity.recentKRAs}</h3>
                        <p className="text-sm text-gray-600">New KRAs Created</p>
                    </div>

                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{metrics.activity.recentReports}</h3>
                        <p className="text-sm text-gray-600">Reports Generated</p>
                    </div>
                </div>
            </div>

            {/* Team Overview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Team Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {data.teams.map((team) => {
                        const teamMembers = data.users.filter(u => u.teamId === team.id)
                        const teamTasks = data.tasks.filter(t => teamMembers.some(m => t.assignedTo.includes(m.id)))
                        const completedTeamTasks = teamTasks.filter(t => t.status === 'completed').length
                        const completionRate = teamTasks.length > 0 ? Math.round((completedTeamTasks / teamTasks.length) * 100) : 0

                        return (
                            <div key={team.id} className="p-4 border border-gray-200 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-2">{team.name}</h3>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p>{teamMembers.length} members</p>
                                    <p>{teamTasks.length} tasks</p>
                                    <p className="text-green-600 font-semibold">{completionRate}% completion</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
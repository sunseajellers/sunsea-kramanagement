'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
// import { getTaskAnalytics, getKRAAnalytics, exportAnalyticsData } from '@/lib/analyticsService'
import { TaskStatusChart, TaskPriorityChart, TaskTrendChart, KRAProgressChart } from '@/components/features/analytics'
import {
    BarChart3,
    Download,
    Loader2,
    TrendingUp,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Target
} from 'lucide-react'

export default function ReportsPage() {
    const { user } = useAuth()
    const [taskAnalytics, setTaskAnalytics] = useState<any>(null)
    const [kraAnalytics, setKraAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        const loadAnalytics = async () => {
            if (!user) return
            setLoading(true)
            try {
                const [taskRes, kraRes] = await Promise.all([
                    fetch(`/api/analytics/tasks?userId=${user.uid}`),
                    fetch(`/api/analytics/kras?userId=${user.uid}`)
                ])
                const taskData = await taskRes.json()
                const kraData = await kraRes.json()
                setTaskAnalytics(taskData.data)
                setKraAnalytics(kraData.data)
            } catch (error) {
                console.error('Failed to load analytics', error)
            } finally {
                setLoading(false)
            }
        }
        loadAnalytics()
    }, [user])

    const handleExport = async () => {
        // TODO: Implement export via API
        alert('Export not implemented yet')
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600 mb-4" />
                <p className="text-gray-500 font-medium">Loading analytics...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            <BarChart3 className="w-8 h-8 mr-3 text-primary-600" />
                            Reports & Analytics
                        </h1>
                        <p className="text-gray-500 mt-1">Insights into your performance and progress</p>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="btn-secondary flex items-center justify-center sm:w-auto w-full"
                    >
                        {exporting ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5 mr-2" />
                                Export Data
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600 uppercase mb-1">Completion Rate</p>
                            <p className="text-3xl font-bold text-blue-700">{taskAnalytics?.completionRate || 0}%</p>
                            <p className="text-xs text-blue-600 mt-2">
                                {taskAnalytics?.completedTasks || 0} of {taskAnalytics?.totalTasks || 0} tasks
                            </p>
                        </div>
                        <div className="p-3 bg-blue-200 rounded-xl">
                            <CheckCircle2 className="w-6 h-6 text-blue-700" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600 uppercase mb-1">Active KRAs</p>
                            <p className="text-3xl font-bold text-green-700">{kraAnalytics?.activeKRAs || 0}</p>
                            <p className="text-xs text-green-600 mt-2">
                                {kraAnalytics?.totalKRAs || 0} total KRAs
                            </p>
                        </div>
                        <div className="p-3 bg-green-200 rounded-xl">
                            <Target className="w-6 h-6 text-green-700" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl border border-yellow-200">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-yellow-600 uppercase mb-1">In Progress</p>
                            <p className="text-3xl font-bold text-yellow-700">{taskAnalytics?.inProgressTasks || 0}</p>
                            <p className="text-xs text-yellow-600 mt-2">
                                Tasks currently active
                            </p>
                        </div>
                        <div className="p-3 bg-yellow-200 rounded-xl">
                            <Clock className="w-6 h-6 text-yellow-700" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-600 uppercase mb-1">Overdue</p>
                            <p className="text-3xl font-bold text-red-700">{taskAnalytics?.overdueTasks || 0}</p>
                            <p className="text-xs text-red-600 mt-2">
                                Tasks past deadline
                            </p>
                        </div>
                        <div className="p-3 bg-red-200 rounded-xl">
                            <AlertTriangle className="w-6 h-6 text-red-700" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Task Status Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Task Status Distribution</h2>
                    {taskAnalytics && <TaskStatusChart data={taskAnalytics.tasksByStatus} />}
                </div>

                {/* Task Priority Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Task Priority Distribution</h2>
                    {taskAnalytics && <TaskPriorityChart data={taskAnalytics.tasksByPriority} />}
                </div>

                {/* Task Trends */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
                        Task Activity (Last 7 Days)
                    </h2>
                    {taskAnalytics && <TaskTrendChart data={taskAnalytics.tasksOverTime} />}
                </div>

                {/* KRA Progress */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">KRA Progress (Top 5)</h2>
                    {kraAnalytics && <KRAProgressChart data={kraAnalytics.kraProgress} />}
                </div>
            </div>

            {/* Summary Table */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Detailed Summary</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Metric</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Count</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Percentage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">Total Tasks</td>
                                <td className="px-4 py-3 text-sm text-gray-700 text-right font-medium">{taskAnalytics?.totalTasks || 0}</td>
                                <td className="px-4 py-3 text-sm text-gray-500 text-right">100%</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">Completed Tasks</td>
                                <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">{taskAnalytics?.completedTasks || 0}</td>
                                <td className="px-4 py-3 text-sm text-green-600 text-right">{taskAnalytics?.completionRate || 0}%</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">In Progress</td>
                                <td className="px-4 py-3 text-sm text-blue-600 text-right font-medium">{taskAnalytics?.inProgressTasks || 0}</td>
                                <td className="px-4 py-3 text-sm text-blue-600 text-right">
                                    {taskAnalytics?.totalTasks > 0
                                        ? Math.round((taskAnalytics.inProgressTasks / taskAnalytics.totalTasks) * 100)
                                        : 0}%
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">Pending</td>
                                <td className="px-4 py-3 text-sm text-gray-600 text-right font-medium">{taskAnalytics?.pendingTasks || 0}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 text-right">
                                    {taskAnalytics?.totalTasks > 0
                                        ? Math.round((taskAnalytics.pendingTasks / taskAnalytics.totalTasks) * 100)
                                        : 0}%
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">Overdue</td>
                                <td className="px-4 py-3 text-sm text-red-600 text-right font-medium">{taskAnalytics?.overdueTasks || 0}</td>
                                <td className="px-4 py-3 text-sm text-red-600 text-right">
                                    {taskAnalytics?.totalTasks > 0
                                        ? Math.round((taskAnalytics.overdueTasks / taskAnalytics.totalTasks) * 100)
                                        : 0}%
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

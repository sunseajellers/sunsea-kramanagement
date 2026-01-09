'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardStats, Task, KRA } from '@/types'
import {
    TrendingUp,
    Clock,
    CheckCircle2,
    Target,
    ArrowRight,
    Calendar,
    Award,
    BarChart3,
    PieChart,
    Activity,
    Zap
} from 'lucide-react'
import { userHasPermission } from '@/lib/rbacService'
import { authenticatedJsonFetch } from '@/lib/apiClient'
import { getPriorityColor, getStatusColor, formatDate } from '@/lib/utils'
import { StatsSkeleton, TaskListSkeleton, EmptyState } from '@/components/common'
import { TaskStatusChart, TaskPriorityChart, TaskTrendChart, KRAProgressChart } from '@/components/features/analytics'

export default function DashboardPage() {
    const { userData, loading: authLoading } = useAuth()
    const router = useRouter()
    const redirectRef = useRef(false)
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [recentTasks, setRecentTasks] = useState<Task[]>([])
    const [activeKRAs, setActiveKRAs] = useState<KRA[]>([])
    const [taskAnalytics, setTaskAnalytics] = useState<any>(null)
    const [kraAnalytics, setKraAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Redirect admin users to admin dashboard
    useEffect(() => {
        if (!redirectRef.current && !authLoading && userData) {
            const checkAdminPermission = async () => {
                try {
                    const isAdmin = await userHasPermission(userData.uid, 'admin', 'access');
                    if (isAdmin) {
                        redirectRef.current = true
                        console.log('🚫 Admin detected on regular dashboard - redirecting to admin dashboard')
                        router.push('/dashboard/admin')
                    }
                } catch (error) {
                    console.error('Error checking admin permission:', error)
                }
            }
            checkAdminPermission()
        }
    }, [userData, authLoading, router])

    useEffect(() => {
        if (!userData?.uid) return
        
        const loadData = async () => {
            // Check if user is admin (will be redirected anyway)
            const isAdmin = await userHasPermission(userData.uid, 'admin', 'access');
            if (isAdmin) return
            
            try {
                const result = await authenticatedJsonFetch('/api/dashboard', {
                    headers: {
                        'x-user-id': userData.uid
                    }
                });
                
                if (result.success && result.data) {
                    const { stats, recentTasks, activeKRAs, taskAnalytics, kraAnalytics } = result.data;
                    setStats(stats);
                    setRecentTasks(recentTasks);
                    setActiveKRAs(activeKRAs);
                    setTaskAnalytics(taskAnalytics);
                    setKraAnalytics(kraAnalytics);
                } else {
                    throw new Error(result.error || 'Failed to load dashboard data');
                }
            } catch (err) {
                console.error('Failed to load dashboard data', err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [userData])

    if (loading || !stats) {
        return (
            <div className="p-6 space-y-6">
                {/* Welcome Section Skeleton */}
                <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 text-white animate-pulse">
                    <div className="h-8 bg-white/20 rounded w-64 mb-2" />
                    <div className="h-4 bg-white/20 rounded w-96" />
                </div>

                {/* Stats Skeleton */}
                <StatsSkeleton />

                {/* Content Skeletons */}
                <div className="grid lg:grid-cols-2 gap-6">
                    <TaskListSkeleton />
                    <TaskListSkeleton />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                    <div className="relative z-10">
                        <h1 className="text-4xl font-bold mb-3 animate-fade-in">
                            Welcome back, {userData?.fullName || 'User'}! 👋
                        </h1>
                        <p className="text-primary-100 text-xl animate-slide-up">
                            Here's what's happening with your team today
                        </p>
                    </div>
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>
                </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-3xl font-bold text-gray-900">{stats.totalTasks}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-blue-700 mb-1">Total Tasks</h3>
                    <p className="text-xs text-green-600 font-semibold">
                        {stats.completedTasks} completed
                    </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Clock className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-3xl font-bold text-gray-900">{stats.pendingTasks}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-purple-700 mb-1">Pending Tasks</h3>
                    <p className="text-xs text-orange-600 font-semibold">
                        {stats.overdueTasks} overdue
                    </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-3xl font-bold text-gray-900">{stats.completionRate}%</span>
                    </div>
                    <h3 className="text-sm font-semibold text-green-700 mb-1">Completion Rate</h3>
                    <p className="text-xs text-green-600 font-semibold">
                        +5% from last week
                    </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Award className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-3xl font-bold text-gray-900">{stats.weeklyScore}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-orange-700 mb-1">Weekly Score</h3>
                    <p className="text-xs text-green-600 font-semibold">
                        Excellent performance!
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Recent Tasks */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-200/50 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white/50">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <Clock className="w-6 h-6 mr-3 text-primary-600" />
                            Recent Tasks
                        </h2>
                        <Link href="/dashboard/tasks" className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center hover:bg-primary-50 px-3 py-1 rounded-lg transition-colors">
                            View All
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                    {recentTasks.length === 0 ? (
                        <div className="p-12">
                            <EmptyState
                                icon={CheckCircle2}
                                title="No tasks yet"
                                description="Create your first task to start tracking your work and achieving your goals."
                                actionLabel="Create Task"
                                actionHref="/dashboard/tasks"
                            />
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100/50">
                            {recentTasks.map((task, index) => {
                                const progress = 0; // TODO: Calculate progress from checklist subcollection
                                return (
                                    <Link
                                        key={task.id}
                                        href={`/dashboard/tasks/${task.id}`}
                                        className="block p-6 hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-secondary-50/30 transition-all duration-200 animate-slide-up"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="font-semibold text-gray-900 flex-1 text-lg">{task.title}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(task.status)} ml-3`}>
                                                {task.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{task.description}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                <span className={`px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                                <span className="flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {formatDate(task.dueDate)}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-500"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-semibold text-gray-600">{progress}%</span>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

                {/* Active KRAs */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-200/50 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white/50">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <Target className="w-6 h-6 mr-3 text-secondary-600" />
                            Active KRAs
                        </h2>
                        <Link href="/dashboard/kras" className="text-sm text-secondary-600 hover:text-secondary-700 font-semibold flex items-center hover:bg-secondary-50 px-3 py-1 rounded-lg transition-colors">
                            View All
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                <div className="divide-y divide-gray-100/50">
                    {activeKRAs.map((kra, index) => (
                        <Link
                            key={kra.id}
                            href={`/dashboard/kras/${kra.id}`}
                            className="block p-6 hover:bg-gradient-to-r hover:from-secondary-50/30 hover:to-purple-50/30 transition-all duration-200 animate-slide-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3 flex-1">
                                    <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Target className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 text-lg">{kra.title}</h3>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(kra.priority)} ml-3`}>
                                    {kra.priority}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2 ml-14">{kra.description}</p>
                            <div className="flex items-center justify-between ml-14">
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                                        {kra.type}
                                    </span>
                                    <span className="flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {formatDate(kra.endDate)}
                                    </span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(kra.status)}`}>
                                    {kra.status.replace('_', ' ')}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
                {/* Quick Actions */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <Award className="w-6 h-6 mr-3 text-primary-600" />
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link
                            href="/dashboard/tasks/new"
                            className="group p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-500 hover:bg-gradient-to-br hover:from-primary-50 hover:to-blue-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <CheckCircle2 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-lg">Create Task</h3>
                                    <p className="text-sm text-gray-600">Add a new task</p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            href="/dashboard/kras/new"
                            className="group p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-secondary-500 hover:bg-gradient-to-br hover:from-secondary-50 hover:to-purple-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Target className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-lg">Create KRA</h3>
                                    <p className="text-sm text-gray-600">Set a new KRA</p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            href="/dashboard/reports"
                            className="group p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Award className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-lg">View Reports</h3>
                                    <p className="text-sm text-gray-600">Check performance</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Analytics Section */}
                <div className="mt-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                        <BarChart3 className="w-8 h-8 mr-3 text-primary-600" />
                        Analytics & Insights
                    </h2>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Task Status Distribution */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <PieChart className="w-5 h-5 mr-2 text-primary-600" />
                                Task Status Distribution
                            </h3>
                            {taskAnalytics?.tasksByStatus && (
                                <TaskStatusChart data={taskAnalytics.tasksByStatus} />
                            )}
                        </div>

                        {/* Task Priority Distribution */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <BarChart3 className="w-5 h-5 mr-2 text-secondary-600" />
                                Task Priority Distribution
                            </h3>
                            {taskAnalytics?.tasksByPriority && (
                                <TaskPriorityChart data={taskAnalytics.tasksByPriority} />
                            )}
                        </div>

                        {/* Task Trend Over Time */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6 lg:col-span-2">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <TrendingUp className="w-5 h-5 mr-2 text-success-600" />
                                Task Trends (Last 7 Days)
                            </h3>
                            {taskAnalytics?.tasksOverTime && (
                                <TaskTrendChart data={taskAnalytics.tasksOverTime} />
                            )}
                        </div>

                        {/* KRA Progress */}
                        {kraAnalytics?.kraProgress && kraAnalytics.kraProgress.length > 0 && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6 lg:col-span-2">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                    <Target className="w-5 h-5 mr-2 text-warning-600" />
                                    KRA Progress Overview
                                </h3>
                                <KRAProgressChart data={kraAnalytics.kraProgress} />
                            </div>
                        )}
                    </div>

                    {/* Key Metrics Summary */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200/50 shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <Activity className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-2xl font-bold text-gray-900">
                                    {taskAnalytics?.completionRate || 0}%
                                </span>
                            </div>
                            <h3 className="text-sm font-semibold text-blue-700 mb-1">Overall Completion Rate</h3>
                            <p className="text-xs text-blue-600">Tasks completed vs total</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50 shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-2xl font-bold text-gray-900">
                                    {taskAnalytics?.inProgressTasks || 0}
                                </span>
                            </div>
                            <h3 className="text-sm font-semibold text-green-700 mb-1">Active Tasks</h3>
                            <p className="text-xs text-green-600">Currently in progress</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200/50 shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <Target className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-2xl font-bold text-gray-900">
                                    {kraAnalytics?.activeKRAs || 0}
                                </span>
                            </div>
                            <h3 className="text-sm font-semibold text-purple-700 mb-1">Active KRAs</h3>
                            <p className="text-xs text-purple-600">Goals being tracked</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

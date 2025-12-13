'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { DashboardStats, Task, KRA } from '@/types'
import {
    TrendingUp,
    Clock,
    CheckCircle2,
    Target,
    ArrowRight,
    Calendar,
    Award
} from 'lucide-react'
import { getUserTasks } from '@/lib/taskService'
import { getUserKRAs } from '@/lib/kraService'
import { getPriorityColor, getStatusColor, formatDate, calculateProgress } from '@/lib/utils'
import { StatsSkeleton, TaskListSkeleton } from '@/components/Skeletons'
import EmptyState from '@/components/EmptyState'

export default function DashboardPage() {
    const { userData } = useAuth()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [recentTasks, setRecentTasks] = useState<Task[]>([])
    const [activeKRAs, setActiveKRAs] = useState<KRA[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!userData?.uid) return
        const fetchData = async () => {
            try {
                const [statsData, tasks, kras] = await Promise.all([
                    getDashboardStats(userData.uid),
                    getUserTasks(userData.uid),
                    getUserKRAs(userData.uid),
                ])
                setStats(statsData)
                setRecentTasks(tasks.slice(0, 5))
                setActiveKRAs(kras.filter((kra: KRA) => kra.status === 'in_progress').slice(0, 3))
            } catch (err) {
                console.error('Failed to load dashboard data', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
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
        <div className="p-6 space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 text-white">
                <h1 className="text-3xl font-bold mb-2">Welcome back, {userData?.fullName || 'User'}! 👋</h1>
                <p className="text-blue-100">Here's what's happening with your team today</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200 card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{stats.totalTasks}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Tasks</h3>
                    <p className="text-xs text-green-600 font-semibold">
                        {stats.completedTasks} completed
                    </p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Pending Tasks</h3>
                    <p className="text-xs text-orange-600 font-semibold">
                        {stats.overdueTasks} overdue
                    </p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{stats.completionRate}%</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Completion Rate</h3>
                    <p className="text-xs text-green-600 font-semibold">
                        +5% from last week
                    </p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 card-hover">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                            <Award className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{stats.weeklyScore}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Weekly Score</h3>
                    <p className="text-xs text-green-600 font-semibold">
                        Excellent performance!
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Tasks */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Recent Tasks</h2>
                        <Link href="/dashboard/tasks" className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center">
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
                        <div className="divide-y divide-gray-100">
                            {recentTasks.map((task) => {
                                const progress = calculateProgress(
                                    task.checklist.filter(item => item.completed).length,
                                    task.checklist.length
                                )
                                return (
                                    <Link
                                        key={task.id}
                                        href={`/dashboard/tasks/${task.id}`}
                                        className="block p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-gray-900 flex-1">{task.title}</h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(task.status)}`}>
                                                {task.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-1">{task.description}</p>
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
                                            <div className="flex items-center space-x-2">
                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all"
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
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Active KRAs</h2>
                    <Link href="/dashboard/kras" className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center">
                        View All
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>
                <div className="divide-y divide-gray-100">
                    {activeKRAs.map((kra) => (
                        <Link
                            key={kra.id}
                            href={`/dashboard/kras/${kra.id}`}
                            className="block p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2 flex-1">
                                    <Target className="w-5 h-5 text-primary-600 flex-shrink-0" />
                                    <h3 className="font-semibold text-gray-900">{kra.title}</h3>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(kra.priority)}`}>
                                    {kra.priority}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2 ml-7">{kra.description}</p>
                            <div className="flex items-center justify-between ml-7">
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                                        {kra.type}
                                    </span>
                                    <span className="flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {formatDate(kra.endDate)}
                                    </span>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(kra.status)}`}>
                                    {kra.status.replace('_', ' ')}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        href="/dashboard/tasks/new"
                        className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Create Task</h3>
                                <p className="text-xs text-gray-600">Add a new task</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/kras/new"
                        className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Create KRA</h3>
                                <p className="text-xs text-gray-600">Set a new KRA</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/reports"
                        className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Award className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">View Reports</h3>
                                <p className="text-xs text-gray-600">Check performance</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    )
}

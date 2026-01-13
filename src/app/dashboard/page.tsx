// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Task, TaskStatus, Priority } from '@/types';
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    Calendar,
    TrendingUp,
    ChevronRight,
    FileText,
    Target,
    Loader2
} from 'lucide-react';
import { isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';

interface TaskWithMeta extends Task {
    // For display purposes
    assignedByName?: string;
}

const priorityColors: Record<Priority, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    low: 'bg-slate-100 text-slate-600 border-slate-200',
};

const statusColors: Record<TaskStatus, string> = {
    not_started: 'bg-slate-100 text-slate-600',
    assigned: 'bg-purple-100 text-purple-700',
    in_progress: 'bg-blue-100 text-blue-700',
    blocked: 'bg-red-100 text-red-700',
    pending_review: 'bg-amber-100 text-amber-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-slate-200 text-slate-500',
    on_hold: 'bg-yellow-100 text-yellow-700',
    revision_requested: 'bg-pink-100 text-pink-700',
};

const statusLabels: Record<TaskStatus, string> = {
    not_started: 'Not Started',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    blocked: 'Blocked',
    pending_review: 'Pending Review',
    completed: 'Completed',
    cancelled: 'Cancelled',
    on_hold: 'On Hold',
    revision_requested: 'Revision Requested',
};

export default function EmployeeDashboard() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [tasks, setTasks] = useState<TaskWithMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'completed'>('all');
    const [selectedTask, setSelectedTask] = useState<TaskWithMeta | null>(null);
    const [updateText, setUpdateText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }

        if (user) {
            fetchMyTasks();
        }
    }, [user, authLoading]);

    const fetchMyTasks = async () => {
        try {
            setLoading(true);
            // Get the Firebase auth token
            const token = await user?.getIdToken();
            const response = await fetch(`/api/tasks?userId=${user?.uid}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (response.ok) {
                const data = await response.json();
                setTasks(data.tasks || []);
            } else {
                console.error('Failed to fetch tasks:', response.status);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredTasks = () => {
        return tasks.filter(task => {
            switch (filter) {
                case 'pending':
                    return !['completed', 'cancelled'].includes(task.status);
                case 'overdue':
                    const dueDate = task.finalTargetDate || task.dueDate;
                    return !['completed', 'cancelled'].includes(task.status) &&
                        isPast(new Date(dueDate)) && !isToday(new Date(dueDate));
                case 'completed':
                    return task.status === 'completed';
                default:
                    return true;
            }
        });
    };

    const getStats = () => {
        const pending = tasks.filter(t => !['completed', 'cancelled'].includes(t.status));
        const overdue = pending.filter(t => {
            const dueDate = t.finalTargetDate || t.dueDate;
            return isPast(new Date(dueDate)) && !isToday(new Date(dueDate));
        });
        const completed = tasks.filter(t => t.status === 'completed');
        const avgKpiScore = tasks.filter(t => t.kpiScore).reduce((sum, t) => sum + (t.kpiScore || 0), 0) /
            (tasks.filter(t => t.kpiScore).length || 1);

        return {
            total: tasks.length,
            pending: pending.length,
            overdue: overdue.length,
            completed: completed.length,
            avgKpiScore: Math.round(avgKpiScore),
        };
    };

    const getDueDateLabel = (task: Task) => {
        const dueDate = new Date(task.finalTargetDate || task.dueDate);
        if (isToday(dueDate)) return 'Due Today';
        if (isTomorrow(dueDate)) return 'Due Tomorrow';
        if (isPast(dueDate)) return `Overdue by ${differenceInDays(new Date(), dueDate)} days`;
        return `Due in ${differenceInDays(dueDate, new Date())} days`;
    };

    const handleStatusUpdate = async (taskId: string, newStatus: TaskStatus) => {
        try {
            setSubmitting(true);
            await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            // Submit task update log
            if (updateText.trim()) {
                await fetch('/api/tasks/updates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        taskId,
                        statusUpdate: updateText,
                        userId: user?.uid,
                        userName: user?.displayName || user?.email,
                    }),
                });
            }

            setUpdateText('');
            setSelectedTask(null);
            await fetchMyTasks();
        } catch (error) {
            console.error('Error updating task:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const stats = getStats();
    const filteredTasks = getFilteredTasks();

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">My Dashboard</h1>
                            <p className="text-sm text-slate-500">Welcome back, {user?.displayName || user?.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <a
                                href="/dashboard/kpi"
                                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition"
                            >
                                Weekly KPIs
                            </a>
                            <a
                                href="/dashboard/activity"
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
                            >
                                Activity Log
                            </a>
                            {isAdmin && (
                                <a
                                    href="/admin"
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
                                >
                                    Admin Panel
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div
                        className={`glass-card p-4 cursor-pointer transition ${filter === 'all' ? 'ring-2 ring-purple-500' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        <div className="flex items-center gap-3">
                            <div className="icon-box icon-box-md bg-purple-100">
                                <FileText className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Tasks</p>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`glass-card p-4 cursor-pointer transition ${filter === 'pending' ? 'ring-2 ring-blue-500' : ''}`}
                        onClick={() => setFilter('pending')}
                    >
                        <div className="flex items-center gap-3">
                            <div className="icon-box icon-box-md bg-blue-100">
                                <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Pending</p>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`glass-card p-4 cursor-pointer transition ${filter === 'overdue' ? 'ring-2 ring-red-500' : ''}`}
                        onClick={() => setFilter('overdue')}
                    >
                        <div className="flex items-center gap-3">
                            <div className="icon-box icon-box-md bg-red-100">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.overdue}</p>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Overdue</p>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`glass-card p-4 cursor-pointer transition ${filter === 'completed' ? 'ring-2 ring-green-500' : ''}`}
                        onClick={() => setFilter('completed')}
                    >
                        <div className="flex items-center gap-3">
                            <div className="icon-box icon-box-md bg-green-100">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Completed</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Score Card */}
                {stats.avgKpiScore > 0 && (
                    <div className="glass-card p-4 mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="icon-box icon-box-md bg-gradient-to-br from-purple-500 to-pink-500">
                                    <Target className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Average KPI Score</p>
                                    <p className="text-2xl font-bold text-slate-900">{stats.avgKpiScore}%</p>
                                </div>
                            </div>
                            <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                                    style={{ width: `${stats.avgKpiScore}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Task List */}
                <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">
                                {filter === 'all' ? 'All Tasks' :
                                    filter === 'pending' ? 'Pending Tasks' :
                                        filter === 'overdue' ? 'Overdue Tasks' : 'Completed Tasks'}
                            </h2>
                            <span className="badge badge-neutral">{filteredTasks.length} tasks</span>
                        </div>
                    </div>

                    {filteredTasks.length === 0 ? (
                        <div className="empty-state py-12">
                            <div className="empty-state-icon">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <p className="empty-state-title">No tasks found</p>
                            <p className="empty-state-description">
                                {filter === 'overdue' ? 'Great job! No overdue tasks.' : 'No tasks match this filter.'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredTasks.map(task => {
                                const dueDate = new Date(task.finalTargetDate || task.dueDate);
                                const isOverdue = isPast(dueDate) && !isToday(dueDate) && task.status !== 'completed';

                                return (
                                    <div
                                        key={task.id}
                                        className={`p-4 hover:bg-slate-50 transition cursor-pointer ${selectedTask?.id === task.id ? 'bg-purple-50' : ''
                                            }`}
                                        onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`badge ${priorityColors[task.priority]}`}>
                                                        {task.priority}
                                                    </span>
                                                    {task.revisionCount && task.revisionCount > 0 && (
                                                        <span className="badge badge-warning">
                                                            {task.revisionCount} revision{task.revisionCount > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                    {task.category && (
                                                        <span className="badge badge-neutral">{task.category}</span>
                                                    )}
                                                </div>
                                                <h3 className="font-medium text-slate-900 truncate">{task.title}</h3>
                                                <p className="text-sm text-slate-500 line-clamp-2 mt-1">{task.description}</p>

                                                <div className="flex items-center gap-4 mt-2 text-xs">
                                                    <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'
                                                        }`}>
                                                        <Calendar className="w-3 h-3" />
                                                        {getDueDateLabel(task)}
                                                    </span>
                                                    {task.kpiScore !== undefined && (
                                                        <span className="flex items-center gap-1 text-purple-600">
                                                            <TrendingUp className="w-3 h-3" />
                                                            KPI: {task.kpiScore}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={`badge ${statusColors[task.status]}`}>
                                                    {statusLabels[task.status]}
                                                </span>
                                                <ChevronRight className={`w-4 h-4 text-slate-400 transition ${selectedTask?.id === task.id ? 'rotate-90' : ''
                                                    }`} />
                                            </div>
                                        </div>

                                        {/* Expanded Task Update Panel */}
                                        {selectedTask?.id === task.id && (
                                            <div className="mt-4 pt-4 border-t border-slate-200" onClick={e => e.stopPropagation()}>
                                                <h4 className="text-sm font-medium text-slate-700 mb-2">Update Status</h4>
                                                <textarea
                                                    value={updateText}
                                                    onChange={e => setUpdateText(e.target.value)}
                                                    placeholder="Enter your progress update..."
                                                    className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    rows={3}
                                                />
                                                <div className="flex items-center gap-2 mt-3">
                                                    {task.status !== 'in_progress' && task.status !== 'completed' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                                                            disabled={submitting}
                                                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                                        >
                                                            Start Working
                                                        </button>
                                                    )}
                                                    {task.status === 'in_progress' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(task.id, 'pending_review')}
                                                            disabled={submitting}
                                                            className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                                                        >
                                                            Submit for Review
                                                        </button>
                                                    )}
                                                    {task.status === 'revision_requested' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(task.id, 'pending_review')}
                                                            disabled={submitting}
                                                            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                                                        >
                                                            Resubmit
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTask(null);
                                                            setUpdateText('');
                                                        }}
                                                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

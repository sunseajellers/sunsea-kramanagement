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
    FileText,
    Loader2,
    LogOut,
    Plus,
    History,
    Edit3,
    ClipboardList
} from 'lucide-react';
import { isPast, isToday, isTomorrow, differenceInDays, format } from 'date-fns';
import TaskForm from '@/components/features/tasks/TaskForm';
import TaskUpdateForm from '@/components/features/tasks/TaskUpdateForm';

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
    const { user, isAdmin, loading: authLoading, signOut } = useAuth();
    const router = useRouter();
    const [tasks, setTasks] = useState<TaskWithMeta[]>([]);
    const [delegatedTasks, setDelegatedTasks] = useState<TaskWithMeta[]>([]);
    const [taskUpdates, setTaskUpdates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'completed'>('all');
    const [selectedTask, setSelectedTask] = useState<TaskWithMeta | null>(null);
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [showUpdateForm, setShowUpdateForm] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }

        if (user) {
            fetchAllData();
        }
    }, [user, authLoading]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchMyTasks(),
                fetchDelegatedTasks(),
                fetchTaskUpdates()
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyTasks = async () => {
        try {
            const token = await user?.getIdToken();
            const response = await fetch(`/api/tasks?userId=${user?.uid}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (response.ok) {
                const data = await response.json();
                setTasks(data.tasks || []);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const fetchDelegatedTasks = async () => {
        try {
            const token = await user?.getIdToken();
            const response = await fetch(`/api/tasks?assignedBy=${user?.uid}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (response.ok) {
                const data = await response.json();
                const delegated = (data.tasks || []).filter((t: TaskWithMeta) =>
                    !t.assignedTo?.includes(user?.uid || '')
                );
                setDelegatedTasks(delegated);
            }
        } catch (error) {
            console.error('Error fetching delegated tasks:', error);
        }
    };

    const fetchTaskUpdates = async () => {
        try {
            const token = await user?.getIdToken();
            const response = await fetch(`/api/tasks/updates?userId=${user?.uid}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (response.ok) {
                const data = await response.json();
                setTaskUpdates(data.updates || []);
            }
        } catch (error) {
            console.error('Error fetching updates:', error);
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

    const stats = getStats();
    const filteredTasks = getFilteredTasks();

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/20">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent tracking-tight">
                                Workspace
                            </h1>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                {user?.displayName || user?.email?.split('@')[0]}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowUpdateForm(true)}
                                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl text-sm font-bold hover:shadow-xl hover:shadow-indigo-500/25 transition-all flex items-center gap-2 border border-white/20 active:scale-95"
                            >
                                <Edit3 className="w-4 h-4" />
                                Log Daily Update
                            </button>
                            <button
                                onClick={() => setShowCreateTask(true)}
                                className="px-5 py-2.5 bg-white text-slate-700 border-2 border-slate-200 rounded-2xl text-sm font-bold hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center gap-2 active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                                Delegate Task
                            </button>
                            {isAdmin && (
                                <a
                                    href="/admin"
                                    className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Admin
                                </a>
                            )}
                            <button
                                onClick={() => signOut()}
                                className="p-2.5 bg-slate-100 text-slate-600 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div
                        className={`group glass-card p-6 cursor-pointer transition-all hover:translate-y-[-4px] ${filter === 'all' ? 'ring-2 ring-indigo-500 shadow-2xl shadow-indigo-500/10' : 'hover:shadow-xl'}`}
                        onClick={() => setFilter('all')}
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-900 leading-tight">{stats.total}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Total Tasks</p>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`group glass-card p-6 cursor-pointer transition-all hover:translate-y-[-4px] ${filter === 'pending' ? 'ring-2 ring-amber-500 shadow-2xl shadow-amber-500/10' : 'hover:shadow-xl'}`}
                        onClick={() => setFilter('pending')}
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-900 leading-tight">{stats.pending}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Pending</p>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`group glass-card p-6 cursor-pointer transition-all hover:translate-y-[-4px] ${filter === 'overdue' ? 'ring-2 ring-red-500 shadow-2xl shadow-red-500/10' : 'hover:shadow-xl'}`}
                        onClick={() => setFilter('overdue')}
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-900 leading-tight">{stats.overdue}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Overdue</p>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`group glass-card p-6 cursor-pointer transition-all hover:translate-y-[-4px] ${filter === 'completed' ? 'ring-2 ring-emerald-500 shadow-2xl shadow-emerald-500/10' : 'hover:shadow-xl'}`}
                        onClick={() => setFilter('completed')}
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-900 leading-tight">{stats.completed}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Completed</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left & Middle Column: Task List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-card overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4 text-indigo-500" />
                                    Active Assignments
                                </h2>
                                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-500">
                                    {filteredTasks.length} ITEMS
                                </span>
                            </div>

                            {filteredTasks.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-slate-900 font-bold">All clear!</h3>
                                    <p className="text-slate-500 text-sm mt-1">No tasks to show in this view.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {filteredTasks.map(task => {
                                        const dueDate = new Date(task.finalTargetDate || task.dueDate);
                                        const isOverdue = isPast(dueDate) && !isToday(dueDate) && task.status !== 'completed';

                                        return (
                                            <div
                                                key={task.id}
                                                className="group p-5 hover:bg-indigo-50/30 transition-all cursor-pointer"
                                                onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {task.taskNumber && (
                                                                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md text-[10px] font-black uppercase tracking-wider border border-slate-300">
                                                                    {task.taskNumber}
                                                                </span>
                                                            )}
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${priorityColors[task.priority]}`}>
                                                                {task.priority}
                                                            </span>
                                                            {task.revisionCount && task.revisionCount > 0 && (
                                                                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[10px] font-black uppercase tracking-wider border border-rose-100">
                                                                    {task.revisionCount} REV
                                                                </span>
                                                            )}
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-black uppercase tracking-wider">
                                                                {task.category || 'General'}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                                            {task.title}
                                                        </h3>
                                                        <p className="text-sm text-slate-500 line-clamp-1 mt-1 font-medium">
                                                            {task.description}
                                                        </p>

                                                        <div className="flex items-center gap-4 mt-3">
                                                            <span className={`flex items-center gap-1.5 text-xs font-bold ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                {getDueDateLabel(task)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2">
                                                        <span className={`px-3 py-1 rounded-xl text-xs font-bold ${statusColors[task.status]}`}>
                                                            {statusLabels[task.status]}
                                                        </span>
                                                        {task.status === 'completed' && (
                                                            <span className={`px-2 py-0.5 mt-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${task.verificationStatus === 'verified' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                task.verificationStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                    'bg-amber-50 text-amber-700 border-amber-200'
                                                                }`}>
                                                                {task.verificationStatus === 'verified' ? 'Verified' :
                                                                    task.verificationStatus === 'rejected' ? 'Rejected' : 'Pending Verify'}
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowUpdateForm(true);
                                                            }}
                                                            className="p-2 opacity-0 group-hover:opacity-100 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-all"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Delegated Section */}
                        {delegatedTasks.length > 0 && (
                            <div className="glass-card overflow-hidden">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-purple-500" />
                                        Delegated to Others
                                    </h2>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {delegatedTasks.map(task => (
                                        <div key={task.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between">
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-bold text-slate-900 truncate">{task.title}</h4>
                                                <p className="text-xs text-slate-400 font-medium">Assigned to: {task.assignedTo?.length} users</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${statusColors[task.status]}`}>
                                                {statusLabels[task.status]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Activity Log */}
                    <div className="space-y-6">
                        <div className="glass-card flex flex-col h-full bg-slate-900 text-white border-0 shadow-2xl">
                            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-indigo-400">
                                    <History className="w-4 h-4" />
                                    Activity Feed
                                </h2>
                            </div>

                            <div className="flex-1 overflow-y-auto max-h-[600px] p-2 space-y-2">
                                {taskUpdates.length === 0 ? (
                                    <div className="py-12 text-center text-slate-500 px-4">
                                        <p className="text-xs font-bold uppercase tracking-widest">No recent activity</p>
                                        <p className="text-[10px] mt-1 opacity-50">Updates you log will appear here in real-time.</p>
                                    </div>
                                ) : (
                                    taskUpdates.map((update) => (
                                        <div key={update.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${update.isKRA ? 'bg-indigo-500/20 text-indigo-300' : 'bg-purple-500/20 text-purple-300'
                                                    }`}>
                                                    {update.isKRA ? 'KRA' : 'TASK'}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500">
                                                    {format(new Date(update.timestamp), 'MMM d, h:mm a')}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
                                                {update.taskTitle}
                                            </h4>
                                            <p className="mt-1 text-xs text-slate-400 font-medium line-clamp-2 italic">
                                                "{update.remarks}"
                                            </p>
                                            <div className="mt-3 flex items-center gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full ${statusColors[update.statusUpdate as TaskStatus] || 'bg-slate-400'}`}></span>
                                                <span className="text-[10px] font-black uppercase tracking-wider opacity-60">
                                                    {statusLabels[update.statusUpdate as TaskStatus] || update.statusUpdate}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 bg-white/5 border-t border-white/10">
                                <button
                                    onClick={() => setShowUpdateForm(true)}
                                    className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                                >
                                    Add New Entry
                                </button>
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="glass-card p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-0 shadow-xl shadow-indigo-500/20">
                            <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-4">Performance Score</h3>
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-4xl font-black">{stats.avgKpiScore}%</div>
                                <div className="w-12 h-12 rounded-full border-4 border-white/20 flex items-center justify-center font-bold text-xs">
                                    API
                                </div>
                            </div>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white transition-all duration-1000"
                                    style={{ width: `${stats.avgKpiScore}%` }}
                                />
                            </div>
                            <p className="text-[10px] mt-4 font-bold opacity-60 uppercase tracking-tighter">Based on target completion vs delay</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            {showCreateTask && (
                <TaskForm
                    onClose={() => setShowCreateTask(false)}
                    onSaved={() => {
                        setShowCreateTask(false);
                        fetchAllData();
                    }}
                />
            )}

            {showUpdateForm && (
                <TaskUpdateForm
                    onClose={() => setShowUpdateForm(false)}
                    onSaved={() => {
                        setShowUpdateForm(false);
                        fetchAllData();
                    }}
                />
            )}
        </div>
    );
}

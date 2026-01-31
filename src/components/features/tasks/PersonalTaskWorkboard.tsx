'use client'

import { useState, useMemo } from 'react'
import { Task, TaskWithMeta } from '@/types'
import { format, isToday, isPast } from 'date-fns'
import {
    CheckCircle2,
    Clock,
    RefreshCcw,
    User,
    Tag,
    Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { authenticatedJsonFetch } from '@/lib/apiClient'
import { toast } from 'sonner'

interface PersonalTaskWorkboardProps {
    tasks: TaskWithMeta[];
    loading?: boolean;
    onRefresh?: () => void;
}

export default function PersonalTaskWorkboard({ tasks: initialTasks, loading, onRefresh }: PersonalTaskWorkboardProps) {
    const [tasks, setTasks] = useState<TaskWithMeta[]>(initialTasks)
    const [completingId, setCompletingId] = useState<string | null>(null)

    // Sync local state when props change
    useMemo(() => {
        setTasks(initialTasks)
    }, [initialTasks])

    const sortedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => {
            const dateA = new Date(a.finalTargetDate || a.dueDate)
            const dateB = new Date(b.finalTargetDate || b.dueDate)

            const isOverdueA = isPast(dateA) && !isToday(dateA) && a.status !== 'completed'
            const isOverdueB = isPast(dateB) && !isToday(dateB) && b.status !== 'completed'

            if (isOverdueA && !isOverdueB) return -1
            if (!isOverdueA && isOverdueB) return 1

            const isTodayA = isToday(dateA) && a.status !== 'completed'
            const isTodayB = isToday(dateB) && b.status !== 'completed'

            if (isTodayA && !isTodayB) return -1
            if (!isTodayA && isTodayB) return 1

            // Then by status (completed last)
            if (a.status === 'completed' && b.status !== 'completed') return 1
            if (a.status !== 'completed' && b.status === 'completed') return -1

            // Finally by date
            return dateA.getTime() - dateB.getTime()
        })
    }, [tasks])

    const handleToggleComplete = async (task: Task) => {
        if (task.status === 'completed') return

        setCompletingId(task.id)
        const previousTasks = [...tasks]

        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.id === task.id ? { ...t, status: 'completed' as any, progress: 100 } : t
        ))

        try {
            const result = await authenticatedJsonFetch(`/api/tasks/${task.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: 'completed',
                    progress: 100,
                    updatedAt: new Date()
                })
            })

            if (result.success) {
                toast.success('Great job! Task finished.')
                if (onRefresh) onRefresh()
            } else {
                throw new Error(result.error)
            }
        } catch (error) {
            setTasks(previousTasks)
            toast.error('Could not update task. Please try again.')
        } finally {
            setCompletingId(null)
        }
    }

    if (loading && tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-[2.5rem] border border-slate-100 backdrop-blur-xl">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Getting your tasks...</p>
            </div>
        )
    }

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-white/50 rounded-[2.5rem] border border-slate-100 backdrop-blur-xl text-center">
                <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">All Done!</h3>
                <p className="text-slate-500 font-medium">You have no tasks to do right now.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Mobile View: High-Performance Cards */}
            <div className="grid gap-6 sm:hidden px-2">
                {sortedTasks.map((task) => {
                    const dueDate = new Date(task.finalTargetDate || task.dueDate)
                    const isOverdue = isPast(dueDate) && !isToday(dueDate) && task.status !== 'completed'
                    const isDueToday = isToday(dueDate) && task.status !== 'completed'
                    const isCompleted = task.status === 'completed'

                    return (
                        <div
                            key={task.id}
                            className={cn(
                                "flex flex-col group relative overflow-hidden transition-all duration-500",
                                "bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/40 p-1",
                                isCompleted && "opacity-80 grayscale-[0.3]"
                            )}
                        >
                            {/* Status Header Bar */}
                            <div className={cn(
                                "h-1.5 w-full rounded-t-full absolute top-0 left-0",
                                isOverdue ? "bg-rose-500" : isDueToday ? "bg-amber-500" : isCompleted ? "bg-emerald-500" : "bg-primary/10"
                            )} />

                            <div className="p-6 space-y-5">
                                {/* Top Cluster: Status & Identity */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <button
                                            onClick={() => handleToggleComplete(task)}
                                            disabled={isCompleted || completingId === task.id}
                                            className={cn(
                                                "w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 shadow-sm active:scale-95",
                                                isCompleted
                                                    ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200"
                                                    : "border-slate-200 bg-white text-transparent hover:border-emerald-400 hover:bg-emerald-50/10",
                                                completingId === task.id && "animate-pulse"
                                            )}
                                        >
                                            {completingId === task.id ? (
                                                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                                            ) : isCompleted ? (
                                                <CheckCircle2 className="w-5 h-5" strokeWidth={3} />
                                            ) : (
                                                <div className="w-4 h-4 rounded-md border-2 border-slate-100 group-hover:border-emerald-200 transition-colors" />
                                            )}
                                        </button>
                                        <div className="flex flex-col">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border mb-1 w-fit",
                                                isOverdue ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                    isDueToday ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                        isCompleted ? "bg-slate-50 text-slate-400 border-slate-100" : "bg-primary/5 text-primary border-primary/10"
                                            )}>
                                                {isOverdue ? 'Overdue!' : isDueToday ? 'Finish Today' : isCompleted ? 'Task Finished' : (task.category || 'General Task')}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{task.frequency || 'One-time'}</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 px-3 py-2 rounded-2xl border border-slate-100 text-right">
                                        <p className={cn(
                                            "text-[11px] font-black uppercase tracking-tight",
                                            isOverdue ? "text-rose-600" : isDueToday ? "text-amber-600" : "text-primary"
                                        )}>
                                            {format(dueDate, 'dd MMM')}
                                        </p>
                                    </div>
                                </div>

                                {/* Task Identity */}
                                <div className="space-y-1.5">
                                    <h4 className={cn(
                                        "text-lg font-black text-primary leading-tight uppercase tracking-tight",
                                        isCompleted && "text-slate-400 line-through"
                                    )}>
                                        {task.title}
                                    </h4>
                                    <p className="text-[12px] text-slate-500 font-medium leading-relaxed italic line-clamp-2">
                                        {task.description}
                                    </p>
                                </div>

                                {/* Footer Logistics */}
                                <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                                            <User className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-[9px] font-black text-primary uppercase tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">
                                                {task.assignedByName || 'Admin'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        {((task.revisionCount ?? 0) > 0) && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">
                                                <RefreshCcw className="w-3 h-3 animate-spin-slow opacity-60" />
                                                <span className="text-[9px] font-black">{task.revisionCount}</span>
                                            </div>
                                        )}
                                        <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/5">
                                            <Clock className="w-3.5 h-3.5 text-primary opacity-20" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden sm:block glass-panel p-0 overflow-hidden border-slate-100 shadow-2xl shadow-slate-100/40">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="bg-slate-50/80 backdrop-blur-md border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Task</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Category</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Given By</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Date Given</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Due Date</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Changes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {sortedTasks.map((task) => {
                                const dueDate = new Date(task.finalTargetDate || task.dueDate)
                                const isOverdue = isPast(dueDate) && !isToday(dueDate) && task.status !== 'completed'
                                const isDueToday = isToday(dueDate) && task.status !== 'completed'
                                const isCompleted = task.status === 'completed'

                                return (
                                    <tr key={task.id} className={cn(
                                        "group transition-all duration-300",
                                        isOverdue ? "bg-rose-50/30 hover:bg-rose-50/50" :
                                            isDueToday ? "bg-amber-50/30 hover:bg-amber-50/50" :
                                                isCompleted ? "bg-emerald-50/10 grayscale-[0.5] opacity-80" : "hover:bg-slate-50/50"
                                    )}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleToggleComplete(task)}
                                                    disabled={isCompleted || completingId === task.id}
                                                    className={cn(
                                                        "w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300 shadow-sm active:scale-95",
                                                        isCompleted
                                                            ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200"
                                                            : "border-slate-200 bg-white text-transparent hover:border-emerald-400 hover:bg-emerald-50/10",
                                                        completingId === task.id && "animate-pulse"
                                                    )}
                                                >
                                                    {completingId === task.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                                                    ) : isCompleted ? (
                                                        <CheckCircle2 className="w-4 h-4" strokeWidth={3} />
                                                    ) : (
                                                        <div className="w-3 h-3 rounded-md border-2 border-slate-100 group-hover:border-emerald-200 transition-colors" />
                                                    )}
                                                </button>
                                                <div className="max-w-md">
                                                    <h4 className={cn(
                                                        "text-[13px] font-black uppercase tracking-tight transition-colors",
                                                        isOverdue ? "text-rose-600" :
                                                            isDueToday ? "text-amber-600 font-extrabold" :
                                                                isCompleted ? "text-slate-400 line-through" : "text-slate-900"
                                                    )}>
                                                        {task.title}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-500 font-medium line-clamp-1 truncate mt-0.5">{task.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-[0.1em] border",
                                                isCompleted ? "bg-slate-50 text-slate-400 border-slate-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                                            )}>
                                                <Tag className="w-2.5 h-2.5 mr-1 opacity-60" />
                                                {task.category || task.frequency || 'TASK'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                                    <User className="w-3 h-3 text-slate-400" />
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-tight",
                                                    isCompleted ? "text-slate-400" : "text-slate-700"
                                                )}>
                                                    {task.assignedByName || 'Admin'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase",
                                                isCompleted ? "text-slate-400" : "text-slate-600"
                                            )}>
                                                {format(new Date(task.createdAt), 'dd MMM yyyy')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <p className={cn(
                                                    "text-[10px] font-black uppercase",
                                                    isOverdue ? "text-rose-600" :
                                                        isDueToday ? "text-amber-600 font-black flex items-center gap-1" :
                                                            isCompleted ? "text-slate-400" : "text-slate-900"
                                                )}>
                                                    {isDueToday && <Clock className="w-2.5 h-2.5" />}
                                                    {format(dueDate, 'dd MMM yyyy')}
                                                </p>
                                                {isOverdue && (
                                                    <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest mt-0.5">Overdue</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {(task.revisionCount ?? 0) > 0 ? (
                                                <span className={cn(
                                                    "inline-flex items-center h-6 px-2 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                                    isCompleted ? "bg-slate-50 text-slate-400 border-slate-100" : "bg-rose-50 text-rose-600 border-rose-100"
                                                )}>
                                                    <RefreshCcw className="w-2.5 h-2.5 mr-1 animate-spin-slow" />
                                                    {task.revisionCount}
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-black text-slate-300">0</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

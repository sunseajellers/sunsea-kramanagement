'use client'

import { useState, useMemo } from 'react'
import { Task, TaskWithMeta } from '@/types'
import { format, isToday, isPast } from 'date-fns'
import {
    CheckCircle2,
    Clock,
    RefreshCcw,
    User,
    Calendar,
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
                toast.success('Goal achieved! Task finalized.')
                if (onRefresh) onRefresh()
            } else {
                throw new Error(result.error)
            }
        } catch (error) {
            setTasks(previousTasks)
            toast.error('Strategic update failed. Please retry.')
        } finally {
            setCompletingId(null)
        }
    }

    if (loading && tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-[2.5rem] border border-slate-100 backdrop-blur-xl">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Workspace...</p>
            </div>
        )
    }

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-white/50 rounded-[2.5rem] border border-slate-100 backdrop-blur-xl text-center">
                <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Workspace Clear</h3>
                <p className="text-slate-500 font-medium">You have no assigned tasks.</p>
            </div>
        )
    }

    return (
        <div className="glass-panel p-0 overflow-hidden border-slate-100 shadow-2xl shadow-slate-100/40">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="bg-slate-50/80 backdrop-blur-md border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Task</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Delegation</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Allotted By</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Date Allotted</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Due Date</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Revisions</th>
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
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleToggleComplete(task)}
                                                disabled={isCompleted || completingId === task.id}
                                                className={cn(
                                                    "w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all transform active:scale-90 flex-shrink-0",
                                                    isCompleted
                                                        ? "bg-emerald-500 border-emerald-500 text-white cursor-default"
                                                        : "bg-white border-slate-200 text-slate-200 hover:border-indigo-500 group-hover:border-indigo-500/50",
                                                    completingId === task.id && "animate-pulse"
                                                )}
                                            >
                                                {completingId === task.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                                ) : isCompleted ? (
                                                    <CheckCircle2 className="w-4 h-4 shadow-sm" />
                                                ) : (
                                                    <div className="w-2.5 h-2.5 rounded-md bg-transparent" />
                                                )}
                                            </button>
                                            <div className="max-w-md">
                                                <h4 className={cn(
                                                    "text-sm font-black uppercase tracking-tight transition-colors",
                                                    isOverdue ? "text-rose-600" :
                                                        isDueToday ? "text-amber-600 font-extrabold" :
                                                            isCompleted ? "text-slate-400 line-through" : "text-slate-900"
                                                )}>
                                                    {task.title}
                                                </h4>
                                                <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">{task.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn(
                                            "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                            isCompleted ? "bg-slate-50 text-slate-400 border-slate-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                                        )}>
                                            <Tag className="w-3 h-3 mr-1.5 opacity-60" />
                                            {task.category || task.frequency || 'TASK'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                                                <User className="w-3 h-3 text-slate-400" />
                                            </div>
                                            <span className={cn(
                                                "text-[11px] font-bold uppercase tracking-tight",
                                                isCompleted ? "text-slate-400" : "text-slate-700"
                                            )}>
                                                {task.assignedByName || 'Admin'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn(
                                            "text-[11px] font-bold uppercase",
                                            isCompleted ? "text-slate-400" : "text-slate-600"
                                        )}>
                                            {format(new Date(task.createdAt), 'dd MMM yyyy')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <p className={cn(
                                                "text-[11px] font-black uppercase",
                                                isOverdue ? "text-rose-600" :
                                                    isDueToday ? "text-amber-600 font-black flex items-center gap-1" :
                                                        isCompleted ? "text-slate-400" : "text-slate-900"
                                            )}>
                                                {isDueToday && <Clock className="w-3 h-3" />}
                                                {format(dueDate, 'dd MMM yyyy')}
                                            </p>
                                            {isOverdue && (
                                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-0.5">Critical Overdue</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        {task.revisionCount ? (
                                            <span className={cn(
                                                "inline-flex items-center h-7 px-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                                isCompleted ? "bg-slate-50 text-slate-400 border-slate-100" : "bg-rose-50 text-rose-600 border-rose-100"
                                            )}>
                                                <RefreshCcw className="w-3 h-3 mr-1.5 animate-spin-slow" />
                                                {task.revisionCount}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-black text-slate-300">0</span>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

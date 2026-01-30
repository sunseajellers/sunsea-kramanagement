'use client'

import { Task } from '@/types'
import { Calendar, Flag, Edit, Trash2, CheckCircle2, Circle, RotateCcw, TrendingUp, Tag } from 'lucide-react'
import { updateTask } from '@/lib/taskService'
import { useState } from 'react'
import { format, isPast, isToday } from 'date-fns'

interface TaskCardProps {
    task: Task
    onEdit: (task: Task) => void
    onDelete: (id: string) => void
    onUpdate: () => void
}

const priorityColors = {
    low: 'bg-blue-100 text-blue-700 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-red-100 text-red-700 border-red-200',
}

const statusColors = {
    not_started: 'bg-gray-100 text-gray-700',
    assigned: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    pending_review: 'bg-purple-100 text-purple-700',
    revision_requested: 'bg-orange-100 text-orange-700',
    blocked: 'bg-red-100 text-red-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-700',
    on_hold: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
}

export default function TaskCard({ task, onEdit, onDelete, onUpdate }: TaskCardProps) {
    const [updating, setUpdating] = useState(false)

    // Use finalTargetDate if set, otherwise use dueDate
    const effectiveDueDate = task.finalTargetDate || task.dueDate
    const isOverdue = isPast(new Date(effectiveDueDate)) && !isToday(new Date(effectiveDueDate)) && task.status !== 'completed'
    const hasExtendedDeadline = task.finalTargetDate && new Date(task.finalTargetDate).getTime() !== new Date(task.dueDate).getTime()

    const handleStatusToggle = async () => {
        setUpdating(true)
        try {
            const newStatus = task.status === 'completed' ? 'assigned' : 'completed'
            await updateTask(task.id, { status: newStatus })
            onUpdate()
        } catch (error) {
            console.error('Failed to update task status', error)
        } finally {
            setUpdating(false)
        }
    }

    return (
        <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-blue-200 transition-all duration-200 relative">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                    {/* Status checkbox */}
                    <button
                        onClick={handleStatusToggle}
                        disabled={updating}
                        className="mt-1 flex-shrink-0 transition-transform hover:scale-105"
                    >
                        {task.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                            <Circle className="w-5 h-5 text-gray-400 hover:text-blue-500" />
                        )}
                    </button>

                    {/* Title */}
                    <div className="flex-1">
                        <h3 className={`text-base font-bold ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'
                            }`}>
                            {task.title}
                        </h3>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(task)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(task.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4 line-clamp-2 ml-0 sm:ml-8">
                {task.description}
            </p>

            {/* Progress Bar - Simplified */}
            <div className="mb-4 ml-0 sm:ml-8">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Progress</span>
                    <span className="text-[10px] font-bold text-blue-600">{task.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${task.progress || 0}%` }}
                    />
                </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-2 ml-0 sm:ml-8">
                {/* Priority badge */}
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tighter ${priorityColors[task.priority]}`}>
                    <Flag className="w-3 h-3 mr-1" />
                    {task.priority}
                </span>

                {/* Status badge */}
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tighter ${statusColors[task.status]}`}>
                    {task.status.replace('_', ' ')}
                </span>

                {/* Revision count badge */}
                {task.revisionCount && task.revisionCount > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tighter bg-pink-50 text-pink-700 border-pink-200">
                        <RotateCcw className="w-3 h-3 mr-1" />
                        {task.revisionCount} revision{task.revisionCount > 1 ? 's' : ''}
                    </span>
                )}

                {/* Category badge */}
                {task.category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tighter bg-slate-50 text-slate-600 border-slate-200">
                        <Tag className="w-3 h-3 mr-1" />
                        {task.category}
                    </span>
                )}

                {/* KPI Score badge */}
                {task.kpiScore !== undefined && task.kpiScore !== null && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tighter ${task.kpiScore >= 80 ? 'bg-green-50 text-green-700 border-green-200' :
                        task.kpiScore >= 60 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-red-50 text-red-700 border-red-200'
                        }`}>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        KPI: {task.kpiScore}%
                    </span>
                )}

                {/* Due date - shows both original and final if different */}
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tighter ${isOverdue ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-100'
                    }`}>
                    <Calendar className="w-3 h-3 mr-1" />
                    {format(new Date(effectiveDueDate), 'dd MMM yyyy')}
                    {isOverdue && <span className="ml-1">(Overdue)</span>}
                </span>

                {/* Extended deadline indicator */}
                {hasExtendedDeadline && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tighter bg-amber-50 text-amber-700 border-amber-200">
                        Extended from {format(new Date(task.dueDate), 'dd MMM')}
                    </span>
                )}
            </div>
        </div>
    )
}


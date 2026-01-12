'use client'

import { Task } from '@/types'
import { Calendar, Flag, Edit, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { updateTask } from '@/lib/taskService'
import { useState } from 'react'

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
}

export default function TaskCard({ task, onEdit, onDelete, onUpdate }: TaskCardProps) {
    const [updating, setUpdating] = useState(false)

    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed'

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

                {/* Due date */}
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tighter ${isOverdue ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-100'
                    }`}>
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(task.dueDate).toLocaleDateString()}
                    {isOverdue && <span className="ml-1">(Overdue)</span>}
                </span>
            </div>
        </div>
    )
}

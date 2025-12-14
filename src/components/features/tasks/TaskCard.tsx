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
        <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:border-primary-100 transition-all duration-300 relative">
            {/* Priority indicator */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary-500 to-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-xl"></div>

            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                    {/* Status checkbox */}
                    <button
                        onClick={handleStatusToggle}
                        disabled={updating}
                        className="mt-1 flex-shrink-0 transition-transform hover:scale-110"
                    >
                        {task.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                            <Circle className="w-5 h-5 text-gray-400 hover:text-primary-500" />
                        )}
                    </button>

                    {/* Title */}
                    <div className="flex-1">
                        <h3 className={`text-base font-semibold ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'
                            }`}>
                            {task.title}
                        </h3>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(task)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
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
            <p className="text-sm text-gray-600 mb-4 line-clamp-2 ml-8">
                {task.description}
            </p>

            {/* Metadata */}
            <div className="flex flex-wrap gap-2 ml-8">
                {/* Priority badge */}
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${priorityColors[task.priority]}`}>
                    <Flag className="w-3 h-3 mr-1" />
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>

                {/* Status badge */}
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                    {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </span>

                {/* Due date */}
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${isOverdue ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-50 text-gray-600'
                    }`}>
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(task.dueDate).toLocaleDateString()}
                    {isOverdue && ' (Overdue)'}
                </span>
            </div>
        </div>
    )
}

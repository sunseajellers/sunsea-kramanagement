'use client'

import { useState, useEffect } from 'react'
import { Task, TaskStatus } from '@/types'
import { updateTask } from '@/lib/taskService'
import { User, Calendar } from 'lucide-react'

interface Props {
    tasks: Task[]
    onTaskClick: (task: Task) => void
    onRefresh: () => void
}

const statusColumns: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'assigned', label: 'Assigned', color: 'bg-gray-100 border-gray-300' },
    { status: 'in_progress', label: 'In Progress', color: 'bg-blue-100 border-blue-300' },
    { status: 'blocked', label: 'Blocked', color: 'bg-red-100 border-red-300' },
    { status: 'completed', label: 'Completed', color: 'bg-green-100 border-green-300' }
]

const priorityColors: Record<string, string> = {
    low: 'text-gray-600 bg-gray-100',
    medium: 'text-blue-600 bg-blue-100',
    high: 'text-orange-600 bg-orange-100',
    critical: 'text-red-600 bg-red-100'
}

export default function TaskBoardView({ tasks, onTaskClick, onRefresh }: Props) {
    const [draggedTask, setDraggedTask] = useState<Task | null>(null)
    const [tasksByStatus, setTasksByStatus] = useState<Record<TaskStatus, Task[]>>({
        not_started: [],
        assigned: [],
        in_progress: [],
        pending_review: [],
        revision_requested: [],
        blocked: [],
        completed: [],
        cancelled: [],
        on_hold: []
    })

    useEffect(() => {
        const grouped: Record<TaskStatus, Task[]> = {
            not_started: [],
            assigned: [],
            in_progress: [],
            pending_review: [],
            revision_requested: [],
            blocked: [],
            completed: [],
            cancelled: [],
            on_hold: []
        }

        tasks.forEach(task => {
            grouped[task.status].push(task)
        })

        setTasksByStatus(grouped)
    }, [tasks])

    const handleDragStart = (task: Task) => {
        setDraggedTask(task)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleDrop = async (status: TaskStatus) => {
        if (!draggedTask || draggedTask.status === status) {
            setDraggedTask(null)
            return
        }

        try {
            await updateTask(draggedTask.id, { status, updatedAt: new Date() })
            onRefresh()
        } catch (error) {
            console.error('Failed to update task status', error)
        } finally {
            setDraggedTask(null)
        }
    }

    const formatDate = (date: Date) => {
        const d = new Date(date)
        const today = new Date()
        const diffTime = d.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays < 0) return 'Overdue'
        if (diffDays === 0) return 'Today'
        if (diffDays === 1) return 'Tomorrow'
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statusColumns.map(column => (
                <div
                    key={column.status}
                    className={`rounded-xl border-2 ${column.color} p-4 min-h-[500px]`}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(column.status)}
                >
                    <div className="mb-4">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">{column.label}</h3>
                        <p className="text-sm text-gray-600">
                            {tasksByStatus[column.status].length} task{tasksByStatus[column.status].length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div className="space-y-3">
                        {tasksByStatus[column.status].map(task => {
                            const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed'

                            return (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={() => handleDragStart(task)}
                                    onClick={() => onTaskClick(task)}
                                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {/* Priority Badge */}
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
                                            {task.priority.toUpperCase()}
                                        </span>
                                        {isOverdue && (
                                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-600">
                                                OVERDUE
                                            </span>
                                        )}
                                    </div>

                                    {/* Task Title */}
                                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                        {task.title}
                                    </h4>

                                    {/* Task Description */}
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                        {task.description}
                                    </p>

                                    {/* Due Date */}
                                    <div className={`flex items-center text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'} mb-2`}>
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {formatDate(task.dueDate)}
                                    </div>

                                    {/* Assignees */}
                                    {task.assignedTo.length > 0 && (
                                        <div className="flex items-center text-xs text-gray-500">
                                            <User className="w-3 h-3 mr-1" />
                                            {task.assignedTo.length} assignee{task.assignedTo.length !== 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {tasksByStatus[column.status].length === 0 && (
                            <div className="text-center py-8 text-gray-400">
                                <p className="text-sm">No tasks</p>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

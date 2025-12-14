'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchTasksForUser, deleteTask } from '@/lib/taskService'
import { Task } from '@/types'
import TaskCard from './TaskCard'
import { Loader2, ListTodo } from 'lucide-react'

interface TaskListProps {
    onEdit: (task: Task) => void
    filterStatus?: string
    filterPriority?: string
}

export default function TaskList({ onEdit, filterStatus, filterPriority }: TaskListProps) {
    const { user } = useAuth()
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)

    const loadTasks = async () => {
        if (!user) return
        setLoading(true)
        try {
            const data = await fetchTasksForUser(user.uid)
            setTasks(data)
        } catch (error) {
            console.error("Failed to load tasks", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadTasks()
    }, [user])

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                await deleteTask(id)
                setTasks(prev => prev.filter(t => t.id !== id))
            } catch (error) {
                alert('Failed to delete task')
            }
        }
    }

    // Apply filters
    const filteredTasks = tasks.filter(task => {
        if (filterStatus && filterStatus !== 'all' && task.status !== filterStatus) {
            return false
        }
        if (filterPriority && filterPriority !== 'all' && task.priority !== filterPriority) {
            return false
        }
        return true
    })

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-4" />
                <p className="text-gray-500 font-medium">Loading your tasks...</p>
            </div>
        )
    }

    if (filteredTasks.length === 0) {
        return (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ListTodo className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {tasks.length === 0 ? 'No Tasks Found' : 'No Matching Tasks'}
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                    {tasks.length === 0
                        ? "You don't have any tasks assigned yet. Create a new task to get started."
                        : "No tasks match your current filters. Try adjusting the filters above."}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {filteredTasks.map((task) => (
                <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEdit}
                    onDelete={handleDelete}
                    onUpdate={loadTasks}
                />
            ))}
        </div>
    )
}

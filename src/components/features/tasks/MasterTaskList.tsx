'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { authenticatedJsonFetch } from '@/lib/apiClient'
import { Task, User } from '@/types'
import {
    Plus,
    Search,
    Filter,
    Tag,
    TrendingUp,
    RotateCcw,
    Edit,
    Trash2,
    Loader2,
    Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import TaskForm from '@/components/features/tasks/TaskForm'
import { deleteTask } from '@/lib/taskService'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function MasterTaskList() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
            </div>
        }>
            <MasterTaskListContent />
        </Suspense>
    )
}

function MasterTaskListContent() {
    const { user } = useAuth()
    const searchParams = useSearchParams()
    const initialUserId = searchParams.get('userId')
    const initialAssignTo = searchParams.get('assignTo')

    const [tasks, setTasks] = useState<Task[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [filterUser, setFilterUser] = useState(initialUserId || 'all')

    // Form states
    const [isFormOpen, setIsFormOpen] = useState(!!initialAssignTo)
    const [editingTask, setEditingTask] = useState<Task | null>(null)

    useEffect(() => {
        loadData()
    }, [filterUser])

    const loadData = async () => {
        setLoading(true)
        try {
            // Fetch users for the filter dropdown
            const { getAllUsers } = await import('@/lib/userService')
            const usersData = await getAllUsers()
            setUsers(usersData)

            // Fetch tasks
            const url = filterUser === 'all'
                ? '/api/tasks?all=true'
                : `/api/tasks?userId=${filterUser}`

            if (!user) return

            const response = await authenticatedJsonFetch(url, {
                headers: {
                    'x-user-id': user.uid
                }
            }) as any
            if (response.tasks) {
                setTasks(response.tasks)
            }
        } catch (error) {
            console.error('Failed to load tasks:', error)
            toast.error('Failed to load tasks')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return
        try {
            await deleteTask(id)
            setTasks(prev => prev.filter(t => t.id !== id))
            toast.success('Task deleted')
        } catch (error) {
            toast.error('Failed to delete task')
        }
    }

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = filterStatus === 'all' || task.status === filterStatus
        return matchesSearch && matchesStatus
    })

    const getUserName = (userIds: string[]) => {
        if (!userIds || userIds.length === 0) return 'Unassigned'
        const user = users.find(u => u.id === userIds[0])
        return user ? user.fullName || user.email : 'Unknown User'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Master Task Repository</h2>
                    <p className="text-gray-400 text-xs font-medium">Replicating MBA 2.0 Spreadsheet structure</p>
                </div>
                <Button
                    onClick={() => {
                        setEditingTask(null)
                        setIsFormOpen(true)
                    }}
                    className="bg-purple-600 hover:bg-purple-700 h-10 px-6 rounded-xl font-bold text-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Task
                </Button>
            </div>

            {/* Filters Bar */}
            <div className="glass-card p-4 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search tasks by title or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-11 border-none bg-gray-50/50 rounded-xl text-sm"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <Users className="w-4 h-4 text-purple-500" />
                        <select
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                            className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                        >
                            <option value="all">All Employees</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.fullName || u.email}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <Filter className="w-4 h-4 text-blue-500" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                        >
                            <option value="all">All Statuses</option>
                            <option value="assigned">Assigned</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="blocked">Blocked</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tasks Repository Grid */}
            <div className="flex-1 glass-card overflow-hidden flex flex-col min-h-[600px]">
                <div className="overflow-x-auto h-full">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="sticky top-0 bg-white z-20 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Task Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Assignee</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Revisions</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">KPI Score</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-4" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Syncing with database...</p>
                                    </td>
                                </tr>
                            ) : filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <p className="text-gray-400 font-medium">No tasks found matching your criteria</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map(task => (
                                    <tr key={task.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`w-2 h-2 rounded-full ${task.priority === 'critical' ? 'bg-red-500' :
                                                        task.priority === 'high' ? 'bg-orange-500' :
                                                            task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                                                        }`} />
                                                    <p className="text-sm font-bold text-gray-900 truncate">{task.title}</p>
                                                </div>
                                                <p className="text-[11px] text-gray-400 line-clamp-1">{task.description}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded-lg">
                                                {getUserName(task.assignedTo)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-tighter">
                                                <Tag className="w-3 h-3 mr-1" />
                                                {task.category || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {task.revisionCount ? (
                                                <span className="inline-flex items-center text-[10px] font-black text-pink-600 bg-pink-50 px-2 py-0.5 rounded uppercase tracking-tighter">
                                                    <RotateCcw className="w-3 h-3 mr-1" />
                                                    {task.revisionCount}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-300">0</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${(task.kpiScore || 0) >= 80 ? 'bg-green-50 text-green-700' :
                                                (task.kpiScore || 0) >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                                }`}>
                                                <TrendingUp className="w-3 h-3 mr-1" />
                                                {task.kpiScore || 0}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-[11px] font-bold text-gray-900">
                                                    {format(new Date(task.finalTargetDate || task.dueDate), 'dd MMM yyyy')}
                                                </p>
                                                {task.finalTargetDate && (
                                                    <p className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">Revised Deadline</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 rounded-lg text-blue-600 hover:bg-blue-50"
                                                    onClick={() => {
                                                        setEditingTask(task)
                                                        setIsFormOpen(true)
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 rounded-lg text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(task.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Task Form Modal */}
            {isFormOpen && (
                <TaskForm
                    initialData={editingTask}
                    onClose={() => {
                        setIsFormOpen(false)
                        setEditingTask(null)
                    }}
                    onSaved={() => {
                        setIsFormOpen(false)
                        setEditingTask(null)
                        loadData()
                    }}
                />
            )}
        </div>
    )
}

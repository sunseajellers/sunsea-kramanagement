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
    RotateCcw,
    Edit,
    Trash2,
    Loader2,
    Users,
    UserPlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import TaskForm from '@/components/features/tasks/TaskForm'
import { deleteTask } from '@/lib/taskService'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useBulkSelection, executeBulkTaskAction } from '@/lib/bulkUtils'
import BulkActionBar from '@/components/features/bulk/BulkActionBar'
import { cn } from '@/lib/utils'

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
    const [bulkActionLoading, setBulkActionLoading] = useState(false)

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

    // Bulk selection hook (after filteredTasks is defined)
    const bulkSelection = useBulkSelection(filteredTasks)

    // Bulk action handlers
    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${bulkSelection.selectedCount} tasks?`)) return
        setBulkActionLoading(true)
        try {
            const result = await executeBulkTaskAction('delete', bulkSelection.selectedIds)
            toast.success(`Deleted ${result.success} tasks`)
            if (result.failed > 0) toast.error(`Failed: ${result.failed}`)
            bulkSelection.clearSelection()
            loadData() // Reload
        } catch (error) {
            toast.error('Bulk delete failed')
        } finally {
            setBulkActionLoading(false)
        }
    }

    const handleBulkReassign = async () => {
        const selectedUser = prompt('Enter user ID to reassign to:')
        if (!selectedUser) return
        setBulkActionLoading(true)
        try {
            const result = await executeBulkTaskAction('reassign', bulkSelection.selectedIds, { assignedTo: [selectedUser] })
            toast.success(`Reassigned ${result.success} tasks`)
            bulkSelection.clearSelection()
            loadData()
        } catch (error) {
            toast.error('Bulk reassign failed')
        } finally {
            setBulkActionLoading(false)
        }
    }

    return (
        <div className="space-y-10 animate-in">
            {/* Header */}
            <div className="page-header flex items-center justify-between">
                <div>
                    <h2 className="section-title">Master Task Ledger</h2>
                    <p className="section-subtitle">System-wide mission control and personnel directive repository</p>
                </div>
                <Button
                    onClick={() => {
                        setEditingTask(null)
                        setIsFormOpen(true)
                    }}
                    className="btn-primary h-12 px-6"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Initialize Directive
                </Button>
            </div>

            {/* Tactical Filters */}
            <div className="glass-panel p-6 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[300px] relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        placeholder="Scan directives by identity or parameters..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input pl-12 h-12"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                            className="form-input h-12 pl-11 pr-10 text-xs font-black uppercase tracking-widest appearance-none"
                        >
                            <option value="all">All Personnel</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.fullName || u.email}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="form-input h-12 pl-11 pr-10 text-xs font-black uppercase tracking-widest appearance-none"
                        >
                            <option value="all">Every Status</option>
                            <option value="assigned">Assigned</option>
                            <option value="in-progress">Operational</option>
                            <option value="completed">Finalized</option>
                            <option value="blocked">Suspended</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Ledger Grid */}
            <div className="glass-panel p-0 overflow-hidden flex flex-col min-h-[600px]">
                <div className="overflow-x-auto h-full scroll-panel">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-md z-20 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5 w-16">
                                    <div className="flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                                            checked={bulkSelection.isAllSelected}
                                            ref={el => {
                                                if (el) el.indeterminate = bulkSelection.isSomeSelected;
                                            }}
                                            onChange={bulkSelection.toggleAll}
                                        />
                                    </div>
                                </th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Directive Identity</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lead Personnel</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sector</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Iterations</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Performance Matrix</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Strategic Deadline</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Force Data Grid...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center">
                                                <Search className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <p className="text-lg font-black text-slate-400 uppercase tracking-tight">Directives Not Located</p>
                                            <p className="text-sm text-slate-400 font-medium whitespace-pre">Adjust vector filters or initialize a new task entity</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map(task => (
                                    <tr key={task.id} className={cn(
                                        "group transition-all duration-300",
                                        bulkSelection.isSelected(task.id) ? 'bg-indigo-50/40' : 'hover:bg-slate-50/50'
                                    )}>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                                                    checked={bulkSelection.isSelected(task.id)}
                                                    onChange={() => bulkSelection.toggleSelection(task.id)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="max-w-md">
                                                <div className="flex items-center gap-3 mb-1.5">
                                                    <div className={cn(
                                                        "w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-white",
                                                        task.priority === 'critical' ? 'bg-rose-500 shadow-rose-200' :
                                                            task.priority === 'high' ? 'bg-amber-500 shadow-amber-200' :
                                                                task.priority === 'medium' ? 'bg-indigo-500 shadow-indigo-200' : 'bg-slate-400 border-slate-200'
                                                    )} />
                                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors truncate">
                                                        {task.title}
                                                    </h4>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium line-clamp-1 leading-none pl-5">{task.description}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                                                    <Users className="w-3 h-3 text-slate-400" />
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">
                                                    {getUserName(task.assignedTo)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="status-badge status-badge-info">
                                                <Tag className="w-3 h-3 mr-1.5 opacity-60" />
                                                {task.category || 'GENERAL'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {task.revisionCount ? (
                                                <span className="inline-flex items-center h-7 px-2.5 rounded-lg text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 uppercase tracking-widest shadow-sm">
                                                    <RotateCcw className="w-3 h-3 mr-1.5 animate-spin-slow" />
                                                    {task.revisionCount}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-300">0</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className={cn(
                                                    "text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border transition-colors shadow-sm",
                                                    (task.kpiScore || 0) >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        (task.kpiScore || 0) >= 60 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                                )}>
                                                    {task.kpiScore || 0}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <p className="text-[11px] font-black text-slate-900 uppercase">
                                                    {format(new Date(task.finalTargetDate || task.dueDate), 'dd MMM yyyy')}
                                                </p>
                                                {task.finalTargetDate && (
                                                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mt-0.5 leading-none">Revised Vector</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl text-indigo-600 hover:bg-indigo-50 border border-slate-100/50"
                                                    onClick={() => {
                                                        setEditingTask(task)
                                                        setIsFormOpen(true)
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl text-rose-600 hover:bg-rose-50 border border-slate-100/50"
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

            {/* Bulk Control Interface */}
            <BulkActionBar
                selectedCount={bulkSelection.selectedCount}
                onClear={bulkSelection.clearSelection}
                actions={[
                    {
                        label: 'Update Assignments',
                        icon: UserPlus,
                        onClick: handleBulkReassign,
                        disabled: bulkActionLoading
                    },
                    {
                        label: 'Purge Records',
                        icon: Trash2,
                        onClick: handleBulkDelete,
                        variant: 'destructive',
                        disabled: bulkActionLoading
                    }
                ]}
            />

            {/* Task Configuration Modal */}
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

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { authenticatedJsonFetch } from '@/lib/apiClient'
import { Task, User } from '@/types'
import {
    Plus,
    Search,
    RotateCcw,
    Edit,
    Trash2,
    Loader2,
    Users,
    UserPlus,
    Upload
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import TaskForm from '@/components/features/tasks/TaskForm'
import BulkTaskUpload from '@/components/features/tasks/BulkTaskUpload'
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
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
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
                    <h2 className="section-title">All Tasks</h2>
                    <p className="section-subtitle">A complete list of all work assigned to your team</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Upload className="w-5 h-5" />
                        <span>Import CSV</span>
                    </button>
                    <button
                        onClick={() => {
                            setEditingTask(null)
                            setIsFormOpen(true)
                        }}
                        className="btn-primary"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Task
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel p-8 flex flex-wrap gap-6 items-center">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                    <Input
                        placeholder="Search for tasks or team members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-14 h-12"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-[180px]">
                        <Select
                            value={filterUser}
                            onValueChange={(v) => setFilterUser(v)}
                        >
                            <SelectTrigger className="h-12 bg-white/50 border-input font-bold uppercase text-[10px] tracking-widest">
                                <SelectValue placeholder="Everyone" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Everyone</SelectItem>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.fullName || u.email}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-[180px]">
                        <Select
                            value={filterStatus}
                            onValueChange={(v) => setFilterStatus(v)}
                        >
                            <SelectTrigger className="h-12 bg-white/50 border-input font-bold uppercase text-[10px] tracking-widest">
                                <SelectValue placeholder="Any Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Any Status</SelectItem>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="in-progress">At Work</SelectItem>
                                <SelectItem value="completed">Finished</SelectItem>
                                <SelectItem value="blocked">On Hold</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="glass-panel p-0 overflow-hidden shadow-2xl shadow-black/[0.03]">
                <div className="overflow-x-auto scroll-panel">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="border-b border-border/40">
                                <th className="px-10 py-6 w-20 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded-lg border-border text-primary focus:ring-primary/20 cursor-pointer transition-all"
                                        checked={bulkSelection.isAllSelected}
                                        ref={el => {
                                            if (el) el.indeterminate = bulkSelection.isSomeSelected;
                                        }}
                                        onChange={bulkSelection.toggleAll}
                                    />
                                </th>
                                <th className="px-10 py-6 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Task Details</th>
                                <th className="px-10 py-6 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Assigned To</th>
                                <th className="px-10 py-6 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Category</th>
                                <th className="px-10 py-6 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] text-center">Changes</th>
                                <th className="px-10 py-6 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] text-center">Score</th>
                                <th className="px-10 py-6 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Due Date</th>
                                <th className="px-10 py-6 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <Loader2 className="w-14 h-14 animate-spin text-primary/40" />
                                            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Loading task list...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-24 h-24 rounded-[3rem] bg-muted/30 flex items-center justify-center">
                                                <Search className="w-10 h-10 text-muted-foreground/20" />
                                            </div>
                                            <p className="text-xl font-black text-primary/40 uppercase tracking-tight">No tasks found</p>
                                            <p className="text-sm text-muted-foreground/50 font-medium">Try adjusting your filters or add a new task</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map(task => (
                                    <tr key={task.id} className={cn(
                                        "group table-row",
                                        bulkSelection.isSelected(task.id) && 'bg-primary/[0.03]'
                                    )}>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded-lg border-border text-primary focus:ring-primary/20 cursor-pointer transition-all"
                                                    checked={bulkSelection.isSelected(task.id)}
                                                    onChange={() => bulkSelection.toggleSelection(task.id)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="max-w-md space-y-1">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-3 h-3 rounded-full shadow-lg ring-4 ring-white",
                                                        task.priority === 'critical' ? 'bg-rose-500 shadow-rose-200' :
                                                            task.priority === 'high' ? 'bg-amber-500 shadow-amber-200' :
                                                                task.priority === 'medium' ? 'bg-indigo-500 shadow-indigo-200' : 'bg-slate-400 border-slate-200'
                                                    )} />
                                                    <h4 className="text-lg font-black text-primary uppercase tracking-tight group-hover:text-secondary transition-colors truncate">
                                                        {task.title}
                                                    </h4>
                                                </div>
                                                <p className="text-xs text-muted-foreground font-medium line-clamp-1 leading-none pl-7">{task.description}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center border border-border shadow-sm">
                                                    <Users className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                                <span className="text-xs font-bold text-primary uppercase">
                                                    {getUserName(task.assignedTo)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className="status-badge status-badge-info">
                                                {task.category || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            {task.revisionCount ? (
                                                <span className="inline-flex items-center h-8 px-4 rounded-xl text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 uppercase tracking-widest shadow-sm">
                                                    <RotateCcw className="w-3.5 h-3.5 mr-2" />
                                                    {task.revisionCount}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-muted-foreground/20">0</span>
                                            )}
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <span className={cn(
                                                "status-badge",
                                                (task.kpiScore || 0) >= 80 ? 'status-badge-success' :
                                                    (task.kpiScore || 0) >= 60 ? 'status-badge-warning' : 'status-badge-danger'
                                            )}>
                                                {task.kpiScore || 0}%
                                            </span>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-col">
                                                <p className="text-xs font-black text-primary uppercase">
                                                    {format(new Date(task.finalTargetDate || task.dueDate), 'dd MMM yyyy')}
                                                </p>
                                                {task.finalTargetDate && (
                                                    <p className="text-[9px] font-black text-secondary tracking-widest mt-1 uppercase leading-none">Extended</p>
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

            {/* CSV Import Modal */}
            {isImportModalOpen && (
                <BulkTaskUpload
                    onClose={() => setIsImportModalOpen(false)}
                    onSuccess={() => {
                        loadData()
                    }}
                />
            )}
        </div>
    )
}

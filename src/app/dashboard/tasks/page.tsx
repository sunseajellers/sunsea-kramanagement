'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Task, TaskView } from '@/types'
import { authenticatedJsonFetch } from '@/lib/apiClient'
import { TaskList, TaskBoardView, TaskCalendarView, TaskForm, TaskDetailModal } from '@/components/features/tasks'
import { Plus, ListTodo, Clock, CheckCircle2, AlertCircle, List, LayoutGrid, Calendar as CalendarIcon, Search } from 'lucide-react'
import { StatsSkeleton, TaskListSkeleton, BoardSkeleton, NoTasksEmptyState, NoSearchResultsEmptyState } from '@/components/common'

export default function TasksPage() {
    const { user } = useAuth()
    const [showForm, setShowForm] = useState(false)
    const [editTask, setEditTask] = useState<null | any>(null)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)
    const [filterStatus, setFilterStatus] = useState('all')
    const [filterPriority, setFilterPriority] = useState('all')
    const [stats, setStats] = useState<any>(null)
    const [loadingStats, setLoadingStats] = useState(true)
    const [tasks, setTasks] = useState<Task[]>([])
    const [loadingTasks, setLoadingTasks] = useState(true)
    const [currentView, setCurrentView] = useState<TaskView>('list')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const loadData = async () => {
            if (!user) return
            setLoadingStats(true)
            setLoadingTasks(true)
            try {
                const result = await authenticatedJsonFetch('/api/tasks', {
                    headers: {
                        'x-user-id': user.uid
                    }
                });
                
                if (result.success && result.data) {
                    setStats(result.data.stats);
                    setTasks(result.data.tasks);
                } else {
                    throw new Error(result.error || 'Failed to load tasks');
                }
            } catch (error) {
                console.error('Failed to load data', error)
            } finally {
                setLoadingStats(false)
                setLoadingTasks(false)
            }
        }
        loadData()
    }, [user, refreshKey])

    const handleCreate = () => {
        setEditTask(null)
        setShowForm(true)
    }

    const handleEdit = (task: any) => {
        setEditTask(task)
        setShowForm(true)
    }

    const handleSaved = () => {
        setShowForm(false)
        setRefreshKey(prev => prev + 1)
    }

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task)
    }

    const handleTaskUpdate = () => {
        setSelectedTask(null)
        setRefreshKey(prev => prev + 1)
    }

    const getFilteredTasks = () => {
        let filtered = tasks

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.description.toLowerCase().includes(query)
            )
        }

        if (filterStatus !== 'all') {
            filtered = filtered.filter(t => t.status === filterStatus)
        }

        if (filterPriority !== 'all') {
            filtered = filtered.filter(t => t.priority === filterPriority)
        }

        return filtered
    }

    const viewButtons = [
        { view: 'list' as TaskView, icon: List, label: 'List' },
        { view: 'board' as TaskView, icon: LayoutGrid, label: 'Board' },
        { view: 'calendar' as TaskView, icon: CalendarIcon, label: 'Calendar' }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            <ListTodo className="w-8 h-8 mr-3 text-primary-600" />
                            My Tasks
                        </h1>
                        <p className="text-gray-500 mt-1">Manage and track your assigned tasks</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="btn-primary flex items-center justify-center sm:w-auto w-full"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create New Task
                    </button>
                </div>

                {/* Stats Cards */}
                {loadingStats ? (
                    <StatsSkeleton />
                ) : stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-blue-600 uppercase">Total</p>
                                    <p className="text-2xl font-bold text-blue-700 mt-1">{stats.total}</p>
                                </div>
                                <ListTodo className="w-8 h-8 text-blue-500 opacity-50" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-yellow-600 uppercase">In Progress</p>
                                    <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.inProgress}</p>
                                </div>
                                <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-green-600 uppercase">Completed</p>
                                    <p className="text-2xl font-bold text-green-700 mt-1">{stats.completed}</p>
                                </div>
                                <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-red-600 uppercase">Overdue</p>
                                    <p className="text-2xl font-bold text-red-700 mt-1">{stats.overdue}</p>
                                </div>
                                <AlertCircle className="w-8 h-8 text-red-500 opacity-50" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* View Switcher and Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* View Switcher */}
                    <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                        {viewButtons.map(({ view, icon: Icon, label }) => (
                            <button
                                key={view}
                                onClick={() => setCurrentView(view)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${currentView === view
                                    ? 'bg-white text-primary-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Search and Filters (only show for list and board views) */}
                    {currentView !== 'calendar' && (
                        <div className="flex flex-wrap gap-4">
                            {/* Search Bar */}
                            <div className="flex-1 min-w-[250px]">
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Search Tasks</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                    <input
                                        type="text"
                                        placeholder="Search by title or description..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full py-3 pl-12 pr-10 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300 text-sm"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Filter by Status</label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300 text-sm"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="blocked">Blocked</option>
                                </select>
                            </div>

                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Filter by Priority</label>
                                <select
                                    value={filterPriority}
                                    onChange={(e) => setFilterPriority(e.target.value)}
                                    className="w-full py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300 text-sm"
                                >
                                    <option value="all">All Priorities</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Task Views */}
            {loadingTasks ? (
                <>
                    {currentView === 'list' && <TaskListSkeleton />}
                    {currentView === 'board' && <BoardSkeleton />}
                    {currentView === 'calendar' && (
                        <div className="bg-white rounded-xl p-8 border border-gray-200 animate-pulse">
                            <div className="h-96 bg-gray-100 rounded-lg" />
                        </div>
                    )}
                </>
            ) : getFilteredTasks().length === 0 ? (
                <div className="bg-white rounded-xl p-12 border border-gray-200">
                    {searchQuery || filterStatus !== 'all' || filterPriority !== 'all' ? (
                        <NoSearchResultsEmptyState onClear={() => {
                            setSearchQuery('')
                            setFilterStatus('all')
                            setFilterPriority('all')
                        }} />
                    ) : (
                        <NoTasksEmptyState onCreate={handleCreate} />
                    )}
                </div>
            ) : (
                <>
                    {currentView === 'list' && (
                        <TaskList
                            key={refreshKey}
                            onEdit={handleEdit}
                            filterStatus={filterStatus}
                            filterPriority={filterPriority}
                        />
                    )}

                    {currentView === 'board' && (
                        <TaskBoardView
                            tasks={getFilteredTasks()}
                            onTaskClick={handleTaskClick}
                            onRefresh={() => setRefreshKey(prev => prev + 1)}
                        />
                    )}

                    {currentView === 'calendar' && (
                        <TaskCalendarView
                            tasks={getFilteredTasks()}
                            onTaskClick={handleTaskClick}
                        />
                    )}
                </>
            )}

            {/* Create/Edit Modal */}
            {showForm && (
                <TaskForm
                    initialData={editTask}
                    onClose={() => setShowForm(false)}
                    onSaved={handleSaved}
                />
            )}

            {/* Task Detail Modal */}
            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={handleTaskUpdate}
                />
            )}
        </div>
    )
}

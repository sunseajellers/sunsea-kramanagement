'use client'

import { useState, useEffect } from 'react'
import { createTask, updateTask } from '@/lib/taskService'
import { fetchKRAs } from '@/lib/kraService'
import { Task, Priority, TaskStatus, TaskFrequency } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, X, Calendar, Flag, FileText, Type, Link as LinkIcon, Users } from 'lucide-react'

interface Props {
    initialData?: Task | null
    onClose: () => void
    onSaved: () => void
}

interface TaskFormData {
    title: string
    description: string
    status: TaskStatus
    priority: Priority
    kraId?: string
    assignedTo: string
    dueDate: string
    category: string
    frequency: TaskFrequency
    finalTargetDate?: string
}

export default function TaskForm({ initialData, onClose, onSaved }: Props) {
    const { user } = useAuth()
    const isEdit = !!initialData
    const [loading, setLoading] = useState(false)
    const [kras, setKras] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])

    const [form, setForm] = useState<TaskFormData>({
        title: '',
        description: '',
        status: 'assigned',
        priority: 'medium',
        kraId: '',
        assignedTo: '',
        dueDate: '',
        category: 'General',
        frequency: 'one-time',
        finalTargetDate: ''
    })

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load all users for the "Assigned To" dropdown (Admin view)
                const { getAllUsers } = await import('@/lib/userService')
                const allUsers = await getAllUsers()
                setUsers(allUsers)

                // Load KRAs
                if (user) {
                    const kraData = await fetchKRAs(user.uid)
                    setKras(kraData)
                }
            } catch (error) {
                console.error('Failed to load initial data', error)
            }
        }
        loadInitialData()
    }, [user])

    useEffect(() => {
        if (initialData) {
            const formatDate = (date: any) => {
                if (!date) return ''
                try {
                    const d = date.toDate ? date.toDate() : new Date(date)
                    return d.toISOString().split('T')[0]
                } catch (e) {
                    return ''
                }
            }

            setForm({
                title: initialData.title,
                description: initialData.description,
                status: initialData.status,
                priority: initialData.priority,
                kraId: initialData.kraId || '',
                assignedTo: initialData.assignedTo[0] || '',
                dueDate: formatDate(initialData.dueDate),
                category: initialData.category || 'General',
                frequency: initialData.frequency || 'one-time',
                finalTargetDate: formatDate(initialData.finalTargetDate)
            })
        }
    }, [initialData])

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value
        setForm({ ...form, [e.target.name]: value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)

        try {
            const taskData: any = {
                title: form.title,
                description: form.description,
                status: form.status,
                priority: form.priority,
                kraId: form.kraId || null,
                assignedTo: [form.assignedTo],
                assignedBy: user.uid,
                dueDate: new Date(form.dueDate),
                category: form.category,
                frequency: form.frequency,
                progress: isEdit ? initialData?.progress : 0,
                updatedAt: new Date()
            }

            if (form.finalTargetDate) {
                taskData.finalTargetDate = new Date(form.finalTargetDate)
            }

            if (isEdit && initialData) {
                await updateTask(initialData.id, taskData)
            } else {
                taskData.createdAt = new Date()
                await createTask(taskData)
            }
            onSaved()
        } catch (err) {
            console.error(err)
            alert('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-slate-200/50">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 p-5 flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-xl font-bold">{isEdit ? 'Edit Task' : 'Assign New Task'}</h2>
                        <p className="text-purple-100 text-sm mt-0.5">Fill in the details below</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Task Title</label>
                            <div className="relative">
                                <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                <input
                                    name="title"
                                    required
                                    placeholder="e.g., Complete Q4 sales report"
                                    className="w-full py-3 pl-12 pr-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300"
                                    value={form.title}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-4 w-4 h-4 text-gray-400 z-10" />
                                <textarea
                                    name="description"
                                    required
                                    placeholder="Describe the task details..."
                                    className="w-full py-3 pl-12 pr-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300 h-24 resize-none"
                                    value={form.description}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Grid for User, Category, Priority, Status */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Assigned To */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assigned To</label>
                                <div className="relative">
                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                    <select
                                        name="assignedTo"
                                        required
                                        className="w-full py-3 pl-12 pr-10 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300 appearance-none bg-white"
                                        value={form.assignedTo}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select User</option>
                                        {users.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.fullName || u.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                                <div className="relative">
                                    <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                    <select
                                        name="category"
                                        className="w-full py-3 pl-12 pr-10 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300 appearance-none bg-white"
                                        value={form.category}
                                        onChange={handleChange}
                                    >
                                        <option value="General">General</option>
                                        <option value="Operational">Operational</option>
                                        <option value="Administrative">Administrative</option>
                                        <option value="Technical">Technical</option>
                                        <option value="Project">Project</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Task Type (Frequency)</label>
                                <div className="relative">
                                    <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                    <select
                                        name="frequency"
                                        className="w-full py-3 pl-12 pr-10 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300 appearance-none bg-white font-bold"
                                        value={form.frequency}
                                        onChange={handleChange}
                                    >
                                        <option value="one-time">One-time</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="fortnightly">Fortnightly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
                                <div className="relative">
                                    <Flag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                    <select
                                        name="priority"
                                        className="w-full py-3 pl-12 pr-10 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300 appearance-none bg-white"
                                        value={form.priority}
                                        onChange={handleChange}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Initial Status</label>
                                <select
                                    name="status"
                                    className="w-full py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300 appearance-none bg-white"
                                    value={form.status}
                                    onChange={handleChange}
                                >
                                    <option value="not_started">Not Started</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>

                        {/* Link to KRA */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Link to KRA (Optional)
                            </label>
                            <div className="relative">
                                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                <select
                                    name="kraId"
                                    className="w-full py-3 pl-12 pr-10 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300 appearance-none bg-white"
                                    value={form.kraId}
                                    onChange={handleChange}
                                >
                                    <option value="">No KRA</option>
                                    {kras.map((kra) => (
                                        <option key={kra.id} value={kra.id}>
                                            {kra.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Dates Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Due Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                    <input
                                        type="date"
                                        name="dueDate"
                                        required
                                        className="w-full py-3 pl-12 pr-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300"
                                        value={form.dueDate}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Final Target Date (Revision)</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                    <input
                                        type="date"
                                        name="finalTargetDate"
                                        className="w-full py-3 pl-12 pr-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300"
                                        value={form.finalTargetDate}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl text-gray-600 font-semibold bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-700 hover:to-fuchsia-700 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    isEdit ? 'Save Changes' : 'Assign Task'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

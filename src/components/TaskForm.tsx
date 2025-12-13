'use client'

import { useState, useEffect } from 'react'
import { createTask, updateTask } from '@/lib/taskService'
import { fetchKRAs } from '@/lib/kraService'
import { Task, Priority, TaskStatus } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, X, Calendar, Flag, FileText, Type, Link as LinkIcon } from 'lucide-react'

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
}

export default function TaskForm({ initialData, onClose, onSaved }: Props) {
    const { user } = useAuth()
    const isEdit = !!initialData
    const [loading, setLoading] = useState(false)
    const [kras, setKras] = useState<any[]>([])

    const [form, setForm] = useState<TaskFormData>({
        title: '',
        description: '',
        status: 'assigned',
        priority: 'medium',
        kraId: '',
        assignedTo: user?.uid || '',
        dueDate: '',
    })

    useEffect(() => {
        // Load KRAs for dropdown
        const loadKRAs = async () => {
            if (user) {
                try {
                    const data = await fetchKRAs(user.uid)
                    setKras(data)
                } catch (error) {
                    console.error('Failed to load KRAs', error)
                }
            }
        }
        loadKRAs()
    }, [user])

    useEffect(() => {
        if (initialData) {
            const formatDate = (dateString: string) => {
                try {
                    return new Date(dateString).toISOString().split('T')[0]
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
                dueDate: formatDate(initialData.dueDate.toString()),
            })
        }
    }, [initialData])

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)

        try {
            const taskData = {
                ...form,
                assignedTo: [form.assignedTo],
                assignedBy: user.uid,
                dueDate: new Date(form.dueDate),
                createdAt: new Date(),
                updatedAt: new Date(),
                checklist: [],
                comments: [],
                activityLog: []
            }

            if (isEdit && initialData) {
                await updateTask(initialData.id, {
                    ...taskData,
                    updatedAt: new Date()
                })
            } else {
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-6 flex justify-between items-center text-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold">{isEdit ? 'Edit Task' : 'Create New Task'}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Task Title</label>
                        <div className="relative">
                            <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                name="title"
                                required
                                placeholder="e.g., Complete Q4 sales report"
                                className="input-field pl-10 w-full"
                                value={form.title}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <textarea
                                name="description"
                                required
                                placeholder="Describe the task details..."
                                className="input-field pl-10 w-full h-24 resize-none py-2"
                                value={form.description}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Priority and Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
                            <div className="relative">
                                <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                    name="priority"
                                    className="input-field pl-10 w-full appearance-none"
                                    value={form.priority}
                                    onChange={handleChange}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                            <select
                                name="status"
                                className="input-field w-full appearance-none"
                                value={form.status}
                                onChange={handleChange}
                            >
                                <option value="assigned">Assigned</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="blocked">Blocked</option>
                            </select>
                        </div>
                    </div>

                    {/* Link to KRA */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Link to KRA (Optional)
                        </label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                name="kraId"
                                className="input-field pl-10 w-full appearance-none"
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
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Due Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="date"
                                name="dueDate"
                                required
                                className="input-field pl-10 w-full"
                                value={form.dueDate}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex items-center px-6 py-2.5"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                isEdit ? 'Save Changes' : 'Create Task'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

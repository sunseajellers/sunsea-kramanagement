'use client'

import { useState, useEffect } from 'react'
import { Task } from '@/types'
import { updateTask, addChecklistItem, reassignTask } from '@/lib/taskService'
import { useAuth } from '@/contexts/AuthContext'
import {
    X,
    Calendar,
    User,
    CheckSquare,
    Plus,
    History,
    UserPlus
} from 'lucide-react'

interface Props {
    task: Task
    onClose: () => void
    onUpdate: () => void
}

const statusOptions = [
    { value: 'assigned', label: 'Assigned', color: 'bg-gray-100 text-gray-700' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
    { value: 'blocked', label: 'Blocked', color: 'bg-red-100 text-red-700' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' }
]

const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' }
]

export default function TaskDetailModal({ task, onClose, onUpdate }: Props) {
    const { user } = useAuth()
    const [localTask, setLocalTask] = useState<Task>(task)
    const [newChecklistItem, setNewChecklistItem] = useState('')
    const [showReassignModal, setShowReassignModal] = useState(false)
    const [reassignEmail, setReassignEmail] = useState('')
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        setLocalTask(task)
    }, [task])

    const handleStatusChange = async (status: string) => {
        if (!user) return
        setUpdating(true)
        try {
            await updateTask(task.id, { status: status as any, updatedAt: new Date() })
            onUpdate()
        } catch (error) {
            console.error('Failed to update status', error)
        } finally {
            setUpdating(false)
        }
    }

    const handlePriorityChange = async (priority: string) => {
        if (!user) return
        setUpdating(true)
        try {
            await updateTask(task.id, { priority: priority as any, updatedAt: new Date() })
            onUpdate()
        } catch (error) {
            console.error('Failed to update priority', error)
        } finally {
            setUpdating(false)
        }
    }

    const handleAddChecklistItem = async () => {
        if (!user || !newChecklistItem.trim()) return
        try {
            await addChecklistItem(task.id, newChecklistItem.trim(), user.uid)
            setNewChecklistItem('')
            onUpdate()
        } catch (error) {
            console.error('Failed to add checklist item', error)
        }
    }

    const handleReassign = async () => {
        if (!user || !reassignEmail.trim()) return
        setUpdating(true)
        try {
            // In a real app, you'd look up the user by email
            // For now, we'll just use the email as the ID (placeholder)
            await reassignTask(task.id, [reassignEmail], user.uid, 'Reassigned via task detail modal')
            setShowReassignModal(false)
            setReassignEmail('')
            onUpdate()
        } catch (error) {
            console.error('Failed to reassign task', error)
            alert('Failed to reassign task. Please try again.')
        } finally {
            setUpdating(false)
        }
    }

    const getChecklistProgress = () => {
        // TODO: Fetch checklist from subcollection
        return 0
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-secondary-600 p-6 flex justify-between items-start text-white z-10">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-2">{localTask.title}</h2>
                            <p className="text-primary-100 text-sm">{localTask.description}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors ml-4"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Status and Priority */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                <div className="flex flex-wrap gap-2">
                                    {statusOptions.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleStatusChange(option.value)}
                                            disabled={updating}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${localTask.status === option.value
                                                ? option.color + ' ring-2 ring-offset-2 ring-primary-500'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                                <div className="flex flex-wrap gap-2">
                                    {priorityOptions.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => handlePriorityChange(option.value)}
                                            disabled={updating}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${localTask.priority === option.value
                                                ? option.color + ' ring-2 ring-offset-2 ring-primary-500'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Task Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <Calendar className="w-5 h-5 text-gray-600" />
                                <div>
                                    <p className="text-xs text-gray-500">Due Date</p>
                                    <p className="text-sm font-medium text-gray-900">{formatDate(localTask.dueDate)}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <User className="w-5 h-5 text-gray-600" />
                                <div>
                                    <p className="text-xs text-gray-500">Assigned To</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {localTask.assignedTo.length} member{localTask.assignedTo.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Reassign Button */}
                        <button
                            onClick={() => setShowReassignModal(true)}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span className="text-sm font-medium">Reassign Task</span>
                        </button>

                        {/* Checklist */}
                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                    <CheckSquare className="w-5 h-5 mr-2 text-primary-600" />
                                    Checklist
                                </h3>
                                {/* TODO: Show checklist progress when subcollection fetching is implemented */}
                                <span className="text-sm font-medium text-gray-600">
                                    Feature coming soon
                                </span>
                            </div>

                            {/* Progress Bar - Hidden until checklist subcollection fetching is implemented */}
                            {false && (
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                                    <div
                                        className="bg-primary-600 h-2 rounded-full transition-all"
                                        style={{ width: `${getChecklistProgress()}%` }}
                                    />
                                </div>
                            )}

                            {/* Checklist Items - Hidden until subcollection fetching is implemented */}
                            <div className="space-y-2 mb-4">
                                {/* TODO: Implement checklist subcollection fetching */}
                            </div>

                            {/* Add Checklist Item - Hidden until subcollection fetching is implemented */}
                            {false && (
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={newChecklistItem}
                                        onChange={(e) => setNewChecklistItem(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                                        placeholder="Add a checklist item..."
                                        className="flex-1 py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300"
                                    />
                                    <button
                                        onClick={handleAddChecklistItem}
                                        className="btn-primary flex items-center px-4"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Activity Log - Hidden until subcollection fetching is implemented */}
                        {false && (
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <History className="w-5 h-5 mr-2 text-primary-600" />
                                    Activity History
                                </h3>
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {/* TODO: Implement activity log subcollection fetching */}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Reassign Modal */}
            {showReassignModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Reassign Task</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Enter the email address of the person you want to reassign this task to.
                        </p>
                        <input
                            type="email"
                            value={reassignEmail}
                            onChange={(e) => setReassignEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="w-full py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300 mb-4"
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowReassignModal(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReassign}
                                disabled={updating || !reassignEmail.trim()}
                                className="btn-primary px-4 py-2"
                            >
                                {updating ? 'Reassigning...' : 'Reassign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

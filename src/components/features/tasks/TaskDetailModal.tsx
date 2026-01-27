'use client'

import { useState, useEffect } from 'react'
import { Task, TaskRevision } from '@/types'
import { updateTask, addChecklistItem, reassignTask, getChecklistItems, getTaskActivityLog, updateChecklistItem } from '@/lib/taskService'
import { getTaskRevisions } from '@/lib/revisionService'
import { getUserByEmail } from '@/lib/authService'
import { useAuth } from '@/contexts/AuthContext'
import RevisionRequestModal from './RevisionRequestModal'
import RevisionResolveModal from './RevisionResolveModal'
import RevisionHistory from './RevisionHistory'
import { cn } from '@/lib/utils'
import {
    X,
    Calendar,
    User,
    CheckSquare,
    Plus,
    History,
    UserPlus,
    AlertCircle,
    CheckCircle,
    Clock,
    CheckCircle2,
    ExternalLink
} from 'lucide-react'

interface Props {
    task: Task
    onClose: () => void
    onUpdate: () => void
}

const statusOptions = [
    { value: 'assigned', label: 'Assigned', color: 'bg-gray-100 text-gray-700' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
    { value: 'pending_review', label: 'Pending Review', color: 'bg-purple-100 text-purple-700' },
    { value: 'revision_requested', label: 'Revision Requested', color: 'bg-orange-100 text-orange-700' },
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
    const { user, userData } = useAuth()
    const [localTask, setLocalTask] = useState<Task>(task)
    const [newChecklistItem, setNewChecklistItem] = useState('')
    const [showReassignModal, setShowReassignModal] = useState(false)
    const [showRevisionRequestModal, setShowRevisionRequestModal] = useState(false)
    const [showRevisionResolveModal, setShowRevisionResolveModal] = useState(false)
    const [reassignEmail, setReassignEmail] = useState('')
    const [updating, setUpdating] = useState(false)
    const [canRequestRevision, setCanRequestRevision] = useState(false)
    const [revisions, setRevisions] = useState<TaskRevision[]>([])
    const [checklist, setChecklist] = useState<any[]>([])
    const [activity, setActivity] = useState<any[]>([])
    const [loadingChecklist, setLoadingChecklist] = useState(false)

    useEffect(() => {
        setLocalTask(task)
        loadRevisions()
        loadChecklist()
        loadActivity()
        checkPermissions()
    }, [task])

    const loadChecklist = async () => {
        setLoadingChecklist(true)
        try {
            const data = await getChecklistItems(task.id)
            setChecklist(data)
        } catch (error) {
            console.error('Failed to load checklist:', error)
        } finally {
            setLoadingChecklist(false)
        }
    }

    const loadActivity = async () => {
        try {
            const data = await getTaskActivityLog(task.id)
            setActivity(data)
        } catch (error) {
            console.error('Failed to load activity:', error)
        }
    }

    const loadRevisions = async () => {
        try {
            const data = await getTaskRevisions(task.id)
            setRevisions(data)
        } catch (error) {
            console.error('Failed to load revisions:', error)
        } finally {
            // Revisions loaded
        }
    }

    const checkPermissions = async () => {
        if (!userData?.uid) return
        setCanRequestRevision(!!userData.isAdmin)
    }

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
            loadChecklist()
            loadActivity()
            onUpdate()
        } catch (error) {
            console.error('Failed to add checklist item', error)
        }
    }

    const handleToggleChecklist = async (itemId: string, completed: boolean) => {
        if (!user) return
        try {
            await updateChecklistItem(task.id, itemId, { completed }, user.uid)
            loadChecklist()
            loadActivity()
            onUpdate()
        } catch (error) {
            console.error('Failed to toggle checklist item', error)
        }
    }

    const handleReassign = async () => {
        if (!user || !reassignEmail.trim()) return
        setUpdating(true)
        try {
            const targetUser = await getUserByEmail(reassignEmail.trim())
            if (!targetUser) {
                alert('User not found with that email address.')
                return
            }

            await reassignTask(task.id, [targetUser.uid], user.uid, 'Reassigned via task detail modal')
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
        if (checklist.length === 0) return 0
        const completed = checklist.filter(item => item.completed).length
        return Math.round((completed / checklist.length) * 100)
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                <div className="flex flex-wrap gap-2">
                                    {statusOptions.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleStatusChange(option.value)}
                                            disabled={updating}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${localTask.status === option.value
                                                ? option.color + ' ring-2 ring-offset-2 ring-primary-500 shadow-sm'
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
                                                ? option.color + ' ring-2 ring-offset-2 ring-primary-500 shadow-sm'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Progress Slider */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-sm font-bold text-gray-800">Task Progress</label>
                                <span className="text-sm font-black text-primary-600 bg-white px-3 py-1 rounded-full shadow-sm border border-primary-100">
                                    {localTask.progress || 0}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={localTask.progress || 0}
                                onChange={async (e) => {
                                    const val = parseInt(e.target.value)
                                    setLocalTask(prev => ({ ...prev, progress: val }))
                                }}
                                onMouseUp={async (e) => {
                                    const val = parseInt((e.target as HTMLInputElement).value)
                                    await updateTask(task.id, { progress: val, updatedAt: new Date() })
                                    onUpdate()
                                }}
                                onTouchEnd={async (e) => {
                                    const val = parseInt((e.target as HTMLInputElement).value)
                                    await updateTask(task.id, { progress: val, updatedAt: new Date() })
                                    onUpdate()
                                }}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                            />
                            <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-medium">
                                <span>START</span>
                                <span>DONE</span>
                            </div>
                        </div>

                        {/* Verification Status Banner */}
                        {localTask.verificationStatus && (
                            <div className={cn(
                                "p-4 rounded-xl flex items-center justify-between mb-6 border animate-in slide-in-from-top-2",
                                localTask.verificationStatus === 'pending' ? "bg-indigo-50 border-indigo-100 text-indigo-700" :
                                    localTask.verificationStatus === 'verified' ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                                        "bg-rose-50 border-rose-100 text-rose-700"
                            )}>
                                <div className="flex items-center gap-3">
                                    {localTask.verificationStatus === 'pending' ? <Clock className="w-5 h-5" /> :
                                        localTask.verificationStatus === 'verified' ? <CheckCircle className="w-5 h-5" /> :
                                            <AlertCircle className="w-5 h-5" />}
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest leading-none">
                                            {localTask.verificationStatus === 'pending' ? 'Awaiting Verification' :
                                                localTask.verificationStatus === 'verified' ? 'Verified & Approved' :
                                                    'Revision Requested'}
                                        </p>
                                        {localTask.rejectionReason && (
                                            <p className="text-xs font-medium mt-1 opacity-80">{localTask.rejectionReason}</p>
                                        )}
                                    </div>
                                </div>
                                {localTask.verifiedAt && (
                                    <p className="text-[10px] font-bold opacity-60">
                                        Processed on {formatDate(localTask.verifiedAt)}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Task Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Due Date</p>
                                    <p className="text-sm font-bold text-gray-900">{formatDate(localTask.dueDate)}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <User className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Assigned To</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {localTask.assignedTo.length} member{localTask.assignedTo.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Proof of Work Section */}
                        {(localTask.proofOfWork || localTask.proofLink) && (
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                                <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em]">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Submission Details
                                </div>
                                <div className="space-y-3">
                                    {localTask.proofOfWork && (
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Results Description</p>
                                            <p className="text-sm text-slate-700 font-medium leading-relaxed bg-white/50 p-4 rounded-2xl border border-slate-100">
                                                {localTask.proofOfWork}
                                            </p>
                                        </div>
                                    )}
                                    {localTask.proofLink && (
                                        <a
                                            href={localTask.proofLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-xs font-black text-indigo-600 hover:text-indigo-700 transition-colors bg-white px-4 py-2 rounded-xl border border-indigo-100 shadow-sm shadow-indigo-50"
                                        >
                                            View Performance Proof
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Reassign Button */}
                        <button
                            onClick={() => setShowReassignModal(true)}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span className="text-sm font-medium">Reassign Task</span>
                        </button>

                        {/* Revision Actions */}
                        {task.status === 'revision_requested' && task.assignedTo.includes(user?.uid || '') && (
                            <button
                                onClick={() => setShowRevisionResolveModal(true)}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                            >
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Mark Revision Complete</span>
                            </button>
                        )}

                        {canRequestRevision && task.status !== 'revision_requested' && task.status !== 'completed' && (
                            <button
                                onClick={() => setShowRevisionRequestModal(true)}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors"
                            >
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Request Revision</span>
                            </button>
                        )}

                        {/* Revision History */}
                        {revisions.length > 0 && (
                            <div className="border-t border-gray-200 pt-6">
                                <RevisionHistory taskId={task.id} />
                            </div>
                        )}

                        {/* Checklist */}
                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                    <CheckSquare className="w-5 h-5 mr-2 text-primary-600" />
                                    Checklist
                                </h3>
                                <span className="text-sm font-black text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
                                    {getChecklistProgress()}% Complete
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-100 rounded-full h-2 mb-6 border border-gray-200 overflow-hidden">
                                <div
                                    className="bg-primary-600 h-full rounded-full transition-all duration-700 ease-out"
                                    style={{ width: `${getChecklistProgress()}%` }}
                                />
                            </div>

                            {/* Checklist Items */}
                            <div className="space-y-3 mb-6">
                                {loadingChecklist ? (
                                    <div className="text-center py-4 text-gray-400 text-sm italic">Syncing tactical requirements...</div>
                                ) : checklist.map(item => (
                                    <div key={item.id} className="group flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-100">
                                        <button
                                            onClick={() => handleToggleChecklist(item.id, !item.completed)}
                                            className={cn(
                                                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                                item.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-200 hover:border-primary-500 bg-white"
                                            )}
                                        >
                                            {item.completed && <CheckCircle2 className="w-4 h-4" />}
                                        </button>
                                        <span className={cn(
                                            "text-sm font-medium transition-all flex-1",
                                            item.completed ? "text-gray-400 line-through" : "text-gray-700"
                                        )}>
                                            {item.text}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Add Checklist Item */}
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newChecklistItem}
                                    onChange={(e) => setNewChecklistItem(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                                    placeholder="Add tactical requirement..."
                                    className="flex-1 py-3 px-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-xl text-sm font-medium outline-none transition-all"
                                />
                                <button
                                    onClick={handleAddChecklistItem}
                                    className="h-12 w-12 flex items-center justify-center bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Activity Log */}
                        <div className="border-t border-gray-200 pt-8 mt-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <History className="w-5 h-5 text-indigo-600" />
                                Operational Audit Log
                            </h3>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {activity.map((log) => (
                                    <div key={log.id} className="relative pl-8 pb-4 border-l-2 border-gray-100 last:border-0 last:pb-0">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-indigo-400" />
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{log.action.replace('_', ' ')}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">{log.timestamp ? formatDate(log.timestamp) : 'Just now'}</p>
                                            </div>
                                            <p className="text-sm text-slate-600 font-medium leading-relaxed">{log.details}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Operator: {log.userName || 'Personnel'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
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

            {/* Revision Request Modal */}
            {showRevisionRequestModal && user && userData && (
                <RevisionRequestModal
                    taskId={task.id}
                    taskTitle={task.title}
                    requestedBy={user.uid}
                    requestedByName={userData.fullName || user.email || 'Unknown'}
                    onClose={() => setShowRevisionRequestModal(false)}
                    onSuccess={() => {
                        loadRevisions()
                        onUpdate()
                    }}
                />
            )}

            {/* Revision Resolve Modal */}
            {showRevisionResolveModal && user && userData && task.lastRevisionId && (
                <RevisionResolveModal
                    revisionId={task.lastRevisionId}
                    taskTitle={task.title}
                    revisionReason={revisions.find(r => r.id === task.lastRevisionId)?.reason || ''}
                    resolvedBy={user.uid}
                    resolvedByName={userData.fullName || user.email || 'Unknown'}
                    onClose={() => setShowRevisionResolveModal(false)}
                    onSuccess={() => {
                        loadRevisions()
                        onUpdate()
                    }}
                />
            )}
        </>
    )
}

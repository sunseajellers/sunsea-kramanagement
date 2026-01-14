'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Task, KRA, TaskStatus } from '@/types'
import { getUserKRAs } from '@/lib/kraService'
import { Loader2, X, ClipboardList, MessageSquare, Calendar, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
    onClose: () => void
    onSaved: () => void
}

export default function TaskUpdateForm({ onClose, onSaved }: Props) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [tasks, setTasks] = useState<Task[]>([])
    const [kras, setKras] = useState<KRA[]>([])

    const [selectedItemId, setSelectedItemId] = useState('')
    const [isKRA, setIsKRA] = useState(false)
    const [status, setStatus] = useState<TaskStatus>('in_progress')
    const [remarks, setRemarks] = useState('')
    const [revisionDate, setRevisionDate] = useState('')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadItems = async () => {
            if (!user) return
            try {
                // Fetch Tasks
                const token = await user.getIdToken()
                const taskRes = await fetch(`/api/tasks?userId=${user.uid}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                const taskData = await taskRes.json()
                setTasks(taskData.tasks || [])

                // Fetch KRAs
                const kraData = await getUserKRAs(user.uid)
                setKras(kraData)
            } catch (err) {
                console.error('Error loading items:', err)
                setError('Failed to load tasks and KRAs')
            } finally {
                setFetching(false)
            }
        }
        loadItems()
    }, [user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedItemId) {
            setError('Please select a Task or KRA')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const token = await user?.getIdToken()
            const response = await fetch('/api/tasks/updates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    taskId: selectedItemId,
                    isKRA,
                    statusUpdate: status, // Mapping status to statusUpdate for compatibility with existing API
                    remarks,
                    revisionDate: revisionDate || null
                }),
            })

            if (response.ok) {
                onSaved()
            } else {
                const data = await response.json()
                setError(data.error || 'Failed to submit update')
            }
        } catch (err) {
            console.error('Error submitting update:', err)
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const selectedItem = isKRA
        ? kras.find(k => k.id === selectedItemId)
        : tasks.find(t => t.id === selectedItemId)

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200/50 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <ClipboardList className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Daily Progress Update</h2>
                            <p className="text-indigo-100 text-xs font-medium opacity-90 mt-0.5 uppercase tracking-wider text-left">Keep your momentum going</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-xl transition-all hover:rotate-90 duration-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="overflow-y-auto p-6 flex-1">
                    {fetching ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
                            <p className="text-slate-500 font-medium animate-pulse text-left">Syncing your tasks...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-in slide-in-from-top-2">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="font-medium text-left">{error}</p>
                                </div>
                            )}

                            {/* Task/KRA Selection */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 ml-1">Select Task or KRA</label>
                                <div className="relative group">
                                    <select
                                        className="w-full py-3.5 pl-4 pr-10 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-300 appearance-none font-medium"
                                        value={selectedItemId}
                                        onChange={(e) => {
                                            const id = e.target.value;
                                            setSelectedItemId(id);
                                            const kraMatch = kras.find(k => k.id === id);
                                            setIsKRA(!!kraMatch);
                                            if (kraMatch) setStatus('in_progress'); // Default for KRA
                                            else {
                                                const taskMatch = tasks.find(t => t.id === id);
                                                if (taskMatch) setStatus(taskMatch.status);
                                            }
                                        }}
                                        required
                                    >
                                        <option value="">Choose from your active list...</option>
                                        {kras.length > 0 && (
                                            <optgroup label="✨ Key Result Areas (Repeating)">
                                                {kras.map(kra => (
                                                    <option key={kra.id} value={kra.id}>
                                                        {kra.kraNumber ? `${kra.kraNumber}: ` : ''}{kra.title}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )}
                                        {tasks.length > 0 && (
                                            <optgroup label="📋 Delegated Tasks (One-time)">
                                                {tasks.map(task => (
                                                    <option key={task.id} value={task.id}>
                                                        {task.taskNumber ? `${task.taskNumber}: ` : ''}{task.title}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none transition-transform group-hover:text-purple-500" />
                                </div>
                                {selectedItem && (
                                    <p className="text-xs text-slate-500 mt-2 px-1 flex items-center gap-1.5 text-left">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                                        {selectedItem.description.substring(0, 100)}...
                                    </p>
                                )}
                                {selectedItem && !isKRA && 'verificationStatus' in selectedItem && (selectedItem as Task).verificationStatus === 'rejected' && (
                                    <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl animate-in fade-in slide-in-from-top-2">
                                        <p className="text-xs font-bold text-red-800 flex items-center gap-2 mb-1">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            Returned for Revision
                                        </p>
                                        <p className="text-xs text-red-600 italic">
                                            "{selectedItem.rejectionReason || 'No reason provided'}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Status */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700 ml-1">Update Status</label>
                                    <div className="relative group">
                                        <select
                                            className="w-full py-3.5 pl-4 pr-10 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-300 appearance-none font-semibold"
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value as TaskStatus)}
                                        >
                                            <option value="not_started">Not Started</option>
                                            <option value="assigned">Assigned</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="blocked">Blocked</option>
                                            <option value="pending_review">Submit for Review</option>
                                            <option value="on_hold">On Hold</option>
                                            <option value="completed" disabled={!isKRA}>Completed</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none transition-transform group-hover:text-purple-500" />
                                    </div>
                                </div>

                                {/* Revision Date */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                        Revision Date
                                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-tighter">(Optional)</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="date"
                                            className="w-full py-3.5 pl-11 pr-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-300 font-medium"
                                            value={revisionDate}
                                            onChange={(e) => setRevisionDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Remarks */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-slate-400" />
                                    Daily Remarks
                                </label>
                                <textarea
                                    className="w-full py-4 px-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-300 h-32 resize-none font-medium placeholder:text-slate-400"
                                    placeholder="What did you accomplish today? Any challenges encountered?"
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-4 shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-4 px-6 rounded-2xl text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 transition-all active:scale-95 text-center"
                                >
                                    Later
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:from-indigo-700 hover:to-purple-700 shadow-xl shadow-purple-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Logging...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            Submit Update
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer Decor */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-[0.2em]">
                        JewelsMatrix Performance Management System
                    </p>
                </div>
            </div>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Task, KRA, TaskStatus } from '@/types'
import { getUserKRAs } from '@/lib/kraService'
import { Loader2, X, ClipboardList, MessageSquare, Calendar, ChevronDown, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    const [proofOfWork, setProofOfWork] = useState('')
    const [proofLink, setProofLink] = useState('')
    const [revisionDate, setRevisionDate] = useState('')
    const [delayReason, setDelayReason] = useState('')
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

    const selectedItem = isKRA
        ? kras.find(k => k.id === selectedItemId)
        : tasks.find(t => t.id === selectedItemId)

    const isOverdue = selectedItem && !isKRA && 'dueDate' in (selectedItem as Task) &&
        (selectedItem as Task).dueDate && new Date((selectedItem as Task).dueDate!) < new Date() &&
        selectedItem.status !== 'completed'

    const handleSubmit = async () => {
        if (!selectedItemId) {
            setError('Please select a Task or KRA')
            return
        }

        if (isOverdue && !delayReason.trim()) {
            setError('Please provide a reason for the delay')
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
                    statusUpdate: status,
                    remarks,
                    proofOfWork: status === 'pending_review' ? proofOfWork : null,
                    proofLink: status === 'pending_review' ? proofLink : null,
                    revisionDate: revisionDate || null,
                    delayReason: isOverdue ? delayReason : null
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

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-500">
            <div className="bg-white rounded-[2.5rem] shadow-luxe max-w-xl w-full overflow-hidden border border-white/20 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 flex justify-between items-center text-white shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Clock className="w-32 h-32" />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner">
                            <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">Progress Update</h2>
                            <p className="text-indigo-100 text-[10px] font-bold opacity-80 mt-1 uppercase tracking-[0.2em]">Log Daily Performance</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-300 relative z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="overflow-y-auto premium-scrollbar p-8 flex-1">
                    {fetching ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-6">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 animate-pulse" />
                                <Loader2 className="absolute inset-0 m-auto w-8 h-8 animate-spin text-indigo-600" />
                            </div>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Syncing Data...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {error && (
                                <div className="p-5 bg-rose-50 border-2 border-rose-100 rounded-3xl flex items-start gap-4 text-rose-600 animate-in slide-in-from-top-2">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="font-bold text-sm">Submission Error</p>
                                        <p className="text-xs font-medium opacity-80">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Task/KRA Selection */}
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Context Reference</label>
                                <div className="relative group">
                                    <select
                                        className="premium-input appearance-none pr-12"
                                        value={selectedItemId}
                                        onChange={(e) => {
                                            const id = e.target.value;
                                            setSelectedItemId(id);
                                            const kraMatch = kras.find(k => k.id === id);
                                            setIsKRA(!!kraMatch);
                                            if (kraMatch) setStatus('in_progress');
                                            else {
                                                const taskMatch = tasks.find(t => t.id === id);
                                                if (taskMatch) setStatus(taskMatch.status);
                                            }
                                        }}
                                        required
                                    >
                                        <option value="">Select an active Task or KRA...</option>
                                        {kras.length > 0 && (
                                            <optgroup label="Core Responsibilities (KRA)">
                                                {kras.map(kra => (
                                                    <option key={kra.id} value={kra.id}>
                                                        {kra.kraNumber}: {kra.title}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )}
                                        {tasks.length > 0 && (
                                            <optgroup label="Assigned Tasks">
                                                {tasks.map(task => (
                                                    <option key={task.id} value={task.id}>
                                                        {task.taskNumber}: {task.title}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-slate-100/50 group-hover:bg-indigo-50 transition-colors pointer-events-none">
                                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                    </div>
                                </div>
                                {selectedItem && (
                                    <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-left-2 transition-all">
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                            {selectedItem.description.substring(0, 120)}...
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Status */}
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Current State</label>
                                    <div className="relative group">
                                        <select
                                            className="premium-input appearance-none pr-12 font-bold text-slate-700"
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
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-slate-100/50 group-hover:bg-indigo-50 transition-colors pointer-events-none">
                                            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                        </div>
                                    </div>
                                </div>

                                {/* Revision Date / Extension Date */}
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                                        {isOverdue ? 'Requested Extension' : 'Next Milestone'}
                                    </label>
                                    <div className="relative group">
                                        <Calendar className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", isOverdue ? "text-rose-400" : "text-slate-400")} />
                                        <input
                                            type="date"
                                            className={cn("premium-input pl-11", isOverdue && "border-rose-200 bg-rose-50/10 focus:border-rose-500 focus:ring-rose-500/10")}
                                            value={revisionDate}
                                            onChange={(e) => setRevisionDate(e.target.value)}
                                            required={isOverdue}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Overdue / Delay Handling */}
                            {isOverdue && (
                                <div className="space-y-4 p-6 bg-rose-50 border-2 border-rose-100 rounded-[2rem] animate-in zoom-in-95 duration-500 shadow-sm">
                                    <div className="flex items-center gap-2 text-rose-600 font-black text-[10px] uppercase tracking-[0.2em]">
                                        <AlertCircle className="w-4 h-4" />
                                        Critical: Task Overdue
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black uppercase text-rose-900 ml-1">Reason for Delay *</label>
                                        <textarea
                                            className="premium-input bg-white border-rose-200 focus:border-rose-500 focus:ring-rose-500/10 h-28 resize-none py-4"
                                            placeholder="Please provide a detailed explanation..."
                                            value={delayReason}
                                            onChange={(e) => setDelayReason(e.target.value)}
                                            required={isOverdue}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Proof of Work - Only for review submission */}
                            {status === 'pending_review' && (
                                <div className="space-y-6 p-8 bg-indigo-50/50 border-2 border-indigo-100 rounded-[2.5rem] animate-in slide-in-from-bottom-4 duration-500 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-5">
                                        <ClipboardList className="w-20 h-20 text-indigo-600" />
                                    </div>
                                    <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] relative z-10">
                                        <ClipboardList className="w-4 h-4" />
                                        Verification Proof Required
                                    </div>

                                    <div className="space-y-4 relative z-10">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black uppercase text-indigo-900 ml-1 tracking-widest">Description of Results *</label>
                                            <textarea
                                                className="premium-input bg-white border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500/10 h-24 resize-none py-4 text-xs"
                                                placeholder="What was the final outcome? Mention key achievements..."
                                                value={proofOfWork}
                                                onChange={(e) => setProofOfWork(e.target.value)}
                                                required={status === 'pending_review'}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black uppercase text-indigo-900 ml-1 tracking-widest">External Proof Link (Optional)</label>
                                            <div className="relative group">
                                                <ClipboardList className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                                <input
                                                    type="url"
                                                    className="premium-input bg-white pl-11 text-xs border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500/10"
                                                    placeholder="https://drive.google.com/..."
                                                    value={proofLink}
                                                    onChange={(e) => setProofLink(e.target.value)}
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium ml-1">Link to documents, code, or images</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Remarks */}
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Detailed Logs</label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                                    <textarea
                                        className="premium-input pl-12 h-36 resize-none py-4"
                                        placeholder="What did you work on today? Any roadblocks?"
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 h-16 rounded-3xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] h-16 bg-slate-900 group relative rounded-3xl overflow-hidden transition-all active:scale-95 disabled:opacity-50 shadow-2xl shadow-slate-200"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="relative z-10 flex items-center justify-center gap-3 text-white font-black text-xs uppercase tracking-[0.2em]">
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Processing
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-5 h-5" />
                                                Commit Entry
                                            </>
                                        )}
                                    </div>
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer Decor */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-[0.3em]">
                        Performance Tracking System
                    </p>
                </div>
            </div>
        </div>
    )
}

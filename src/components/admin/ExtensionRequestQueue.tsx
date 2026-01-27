'use client'

import { useState, useEffect } from 'react'
import { Calendar, CheckCircle2, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ExtensionRequest {
    id: string
    title: string
    taskNumber: string
    userName: string
    department: string
    currentDueDate: any
    requestedDate: any
    delayReason: string
}

export default function ExtensionRequestQueue() {
    const [requests, setRequests] = useState<ExtensionRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/admin/tasks/extensions')
            const data = await res.json()
            setRequests(data.requests || [])
        } catch (error) {
            console.error('Error fetching extensions:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (taskId: string, action: 'approve' | 'reject') => {
        setProcessingId(taskId)
        try {
            const res = await fetch(`/api/admin/tasks/extensions/${taskId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, reason: action === 'reject' ? 'Schedule conflict' : '' })
            })

            if (res.ok) {
                toast.success(`Extension ${action}ed successfully`)
                setRequests(prev => prev.filter(r => r.id !== taskId))
            } else {
                throw new Error('Failed to process request')
            }
        } catch (error) {
            toast.error('Action failed')
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Requests...</p>
            </div>
        )
    }

    if (requests.length === 0) {
        return (
            <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="font-black text-slate-900 text-lg">All caught up!</h3>
                <p className="text-slate-500 text-sm font-medium">No pending extension requests found.</p>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in">
            <div className="page-header flex items-center justify-between">
                <div>
                    <h2 className="section-title">Timeline Adjustments</h2>
                    <p className="section-subtitle">Manage tactical schedule revisions and employee delay reports</p>
                </div>
                <div className="status-badge status-badge-neutral px-6 py-2">
                    {requests.length} PENDING AUDIT
                </div>
            </div>

            <div className="grid gap-8">
                {requests.map((req) => (
                    <div key={req.id} className="glass-panel group p-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                        <div className="flex flex-col xl:flex-row gap-10">
                            <div className="flex-1 space-y-8">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 shadow-sm">
                                                {req.taskNumber}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{req.department}</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                            {req.title}
                                        </h3>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 flex items-center justify-between group/user">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Originator</p>
                                            <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{req.userName}</span>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-200 shadow-sm group-hover/user:border-indigo-100 group-hover/user:text-indigo-600 transition-all">
                                            <User className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="p-6 bg-rose-50/30 rounded-[1.5rem] border border-rose-100 group/timeline">
                                        <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-3">Timeline Modification</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-rose-600 line-through opacity-50">
                                                {req.currentDueDate ? format(new Date(req.currentDueDate.seconds * 1000), 'MMM dd, yyyy') : 'N/A'}
                                            </span>
                                            <div className="h-px bg-rose-200 flex-1 mx-4 relative">
                                                <ArrowRight className="absolute -top-1.5 right-0 w-3 h-3 text-rose-400" />
                                            </div>
                                            <span className="text-sm font-black text-rose-600 bg-white px-3 py-1 rounded-lg border border-rose-100 shadow-sm flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                {req.requestedDate ? format(new Date(req.requestedDate.seconds * 1000), 'MMM dd, yyyy') : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-amber-50/50 rounded-[2rem] border-2 border-dashed border-amber-200 flex items-start gap-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] -rotate-12 pointer-events-none">
                                        <AlertCircle className="w-24 h-24" />
                                    </div>
                                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                                    <div className="space-y-2 relative">
                                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-[0.2em]">Deployment Impediment</p>
                                        <p className="text-base font-black text-slate-900 leading-relaxed italic tracking-tight">
                                            "{req.delayReason}"
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col justify-center gap-4 xl:w-[240px] shrink-0">
                                <Button
                                    onClick={() => handleAction(req.id, 'approve')}
                                    disabled={!!processingId}
                                    className="btn-primary h-16 w-full text-[11px] tracking-[0.2em]"
                                >
                                    {processingId === req.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'AUTHORIZE REVISION'}
                                </Button>
                                <Button
                                    onClick={() => handleAction(req.id, 'reject')}
                                    disabled={!!processingId}
                                    variant="outline"
                                    className="h-16 w-full border-2 border-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 transition-all active:scale-95 shadow-sm"
                                >
                                    REVISE DENIAL
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div >
    )
}

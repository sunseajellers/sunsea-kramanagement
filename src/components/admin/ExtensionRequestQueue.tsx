'use client'

import { useState, useEffect } from 'react'
import { Calendar, CheckCircle2, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'

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
            <div className="flex flex-col items-center justify-center py-32 gap-6">
                <Loader2 className="w-14 h-14 animate-spin text-primary/40" />
                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Loading requests...</p>
            </div>
        )
    }

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
                <div className="w-24 h-24 rounded-[3.5rem] bg-muted/30 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-muted-foreground/20" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-black text-primary uppercase tracking-tight">No requests</h3>
                    <p className="text-muted-foreground/60 text-sm font-medium">There are no pending deadline requests at the moment.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-12 animate-in">
            <div className="page-header flex items-center justify-between">
                <div>
                    <h2 className="section-title">Deadline Requests</h2>
                    <p className="section-subtitle">Review requests from team members who need more time to finish tasks</p>
                </div>
                <div className="status-badge bg-primary/5 text-primary border-primary/10 px-6 py-2.5">
                    {requests.length} REQUESTS WAITING
                </div>
            </div>

            <div className="grid gap-10">
                {requests.map((req) => (
                    <div key={req.id} className="glass-panel group p-0 overflow-hidden border-border/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                        <div className="flex flex-col xl:flex-row items-stretch">
                            <div className="flex-1 p-10 space-y-10">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-4 py-1.5 rounded-xl border border-primary/10 shadow-sm">
                                            {req.taskNumber}
                                        </span>
                                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">{req.department}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-primary group-hover:text-secondary transition-colors uppercase tracking-tight">
                                        {req.title}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-8 bg-muted/30 rounded-[2.5rem] border border-border/40 flex items-center justify-between group/user transition-colors hover:bg-muted/50">
                                        <div>
                                            <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] mb-2">Team Member</p>
                                            <span className="text-base font-black text-primary uppercase tracking-tight">{req.userName}</span>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-border shadow-sm group-hover/user:border-secondary/50 group-hover/user:text-secondary transition-all">
                                            <User className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="p-8 bg-destructive/5 rounded-[2.5rem] border border-destructive/10 group/timeline">
                                        <p className="text-[9px] font-black text-destructive/60 uppercase tracking-[0.3em] mb-4">Date Change</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-destructive/40 line-through">
                                                {req.currentDueDate ? format(new Date(req.currentDueDate.seconds * 1000), 'MMM dd, yyyy') : 'N/A'}
                                            </span>
                                            <div className="h-px bg-destructive/20 flex-1 mx-5 relative">
                                                <ArrowRight className="absolute -top-1.5 right-0 w-3 h-3 text-destructive/40" />
                                            </div>
                                            <span className="text-sm font-black text-destructive bg-white px-4 py-2 rounded-xl border border-destructive/10 shadow-sm flex items-center gap-3">
                                                <Calendar className="w-4 h-4" />
                                                {req.requestedDate ? format(new Date(req.requestedDate.seconds * 1000), 'MMM dd, yyyy') : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 bg-amber-400/5 rounded-[3rem] border-2 border-dashed border-amber-200 flex items-start gap-8 relative overflow-hidden transition-colors hover:bg-amber-400/10">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 pointer-events-none scale-150">
                                        <AlertCircle className="w-24 h-24 text-amber-600" />
                                    </div>
                                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-amber-200/20 shrink-0">
                                        <AlertCircle className="w-7 h-7 text-amber-600" />
                                    </div>
                                    <div className="space-y-3 relative">
                                        <p className="text-[10px] font-black text-amber-600/60 uppercase tracking-[0.3em]">Reason for Delay</p>
                                        <p className="text-lg font-black text-primary leading-relaxed italic tracking-tight">
                                            "{req.delayReason}"
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="xl:w-80 bg-muted/20 border-l border-border/20 p-10 flex flex-col justify-center gap-4">
                                <button
                                    onClick={() => handleAction(req.id, 'approve')}
                                    disabled={!!processingId}
                                    className="w-full h-16 btn-primary shadow-xl shadow-primary/10"
                                >
                                    {processingId === req.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Approve Extension'}
                                </button>
                                <button
                                    onClick={() => handleAction(req.id, 'reject')}
                                    disabled={!!processingId}
                                    className="w-full h-16 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-destructive hover:bg-destructive/5 border-2 border-destructive/10 hover:border-destructive/30 transition-all shadow-sm active:translate-y-0.5"
                                >
                                    Decline Request
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

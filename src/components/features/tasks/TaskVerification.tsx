'use client'

import { useState, useEffect } from 'react'
import { Task } from '@/types'
import { getAllTasks, verifyTask } from '@/lib/taskService'
import {
    CheckCircle2,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function TaskVerification() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [verifying, setVerifying] = useState<string | null>(null)

    // Rejection state
    const [rejectingTask, setRejectingTask] = useState<Task | null>(null)
    const [rejectionReason, setRejectionReason] = useState('')

    useEffect(() => {
        loadTasks()
    }, [])

    const loadTasks = async () => {
        try {
            setLoading(true)
            const allTasks = await getAllTasks(500)
            const pendingTasks = allTasks.filter(t => t.verificationStatus === 'pending')
            setTasks(pendingTasks)
        } catch (error) {
            toast.error('Failed to load pending tasks')
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async (taskId: string) => {
        try {
            setVerifying(taskId)
            await verifyTask(taskId, 'verified')
            toast.success('Task verified and completed')
            setTasks(prev => prev.filter(t => t.id !== taskId))
        } catch (error) {
            toast.error('Failed to verify task')
        } finally {
            setVerifying(null)
        }
    }

    const handleReject = async () => {
        if (!rejectingTask || !rejectionReason.trim()) return

        try {
            setVerifying(rejectingTask.id)
            await verifyTask(rejectingTask.id, 'rejected', rejectionReason)
            toast.success('Revision requested')
            setTasks(prev => prev.filter(t => t.id !== rejectingTask.id))
            setRejectingTask(null)
            setRejectionReason('')
        } catch (error) {
            toast.error('Failed to reject task')
        } finally {
            setVerifying(null)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Scanning Verification Queue...</p>
            </div>
        )
    }

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
                <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-slate-200" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-900">Queue Empty</h3>
                    <p className="text-slate-400 text-sm font-medium mt-1">All submitted tasks have been processed.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in">
            <div className="page-header flex items-center justify-between">
                <div>
                    <h2 className="section-title">Verification Protocol</h2>
                    <p className="section-subtitle">Awaiting administrative validation and quality clearance</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {tasks.map(task => (
                    <div
                        key={task.id}
                        className="glass-panel p-8 flex flex-col lg:flex-row gap-8 items-start justify-between group"
                    >
                        <div className="space-y-6 flex-1 w-full">
                            <div className="flex items-center gap-3">
                                <span className="inline-flex h-6 px-2.5 items-center rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
                                    {task.taskNumber || 'REQ-ALPHA'}
                                </span>
                                <span className={cn(
                                    "inline-flex h-6 px-2.5 items-center rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                    task.priority === 'critical' ? "bg-rose-50 text-rose-700 border-rose-100" :
                                        task.priority === 'high' ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-slate-50 text-slate-700 border-slate-200"
                                )}>
                                    {task.priority} PHASE
                                </span>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                                    {task.title}
                                </h3>
                                <div className="flex items-center gap-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                    <span className="flex items-center gap-2 italic">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                        Personnel: <span className="text-slate-900">{task.assignedTo?.join(', ') || 'UNASSIGNED'}</span>
                                    </span>
                                    <span className="flex items-center gap-2 italic">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                        Target: <span className="text-slate-900">{new Date(task.dueDate).toLocaleDateString()}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Evidence Vault */}
                            <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/80 relative overflow-hidden group/proof">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/proof:opacity-10 transition-opacity">
                                    <CheckCircle2 className="w-12 h-12" />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Manifest Evidence</p>
                                <p className="text-sm font-medium text-slate-700 leading-relaxed italic pr-12">
                                    "{task.proofOfWork || 'No specific textual evidence provided for this submission cycle.'}"
                                </p>
                                {task.proofLink && (
                                    <a
                                        href={task.proofLink}
                                        target="_blank"
                                        className="mt-6 inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-200 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                                    >
                                        Inspect External Document
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Tactical Controls */}
                        <div className="flex lg:flex-col gap-3 shrink-0 w-full lg:w-48 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setRejectingTask(task)}
                                disabled={!!verifying}
                                className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-rose-600 hover:bg-rose-50 border-2 border-rose-100 hover:border-rose-200 transition-all shadow-sm"
                            >
                                Request Revision
                            </Button>
                            <Button
                                onClick={() => handleVerify(task.id)}
                                disabled={!!verifying}
                                className="flex-1 h-14 btn-primary"
                            >
                                {verifying === task.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authorize Completion'}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Rejection Interface Overlay */}
            <Dialog open={!!rejectingTask} onOpenChange={(open) => !open && setRejectingTask(null)}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-gradient-to-br from-rose-600 to-rose-700 px-8 py-10 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <CheckCircle2 className="w-24 h-24 rotate-12" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight uppercase">Correction Directive</h2>
                        <p className="text-rose-100 text-[10px] font-black mt-1 uppercase tracking-widest opacity-80">Define specific parameters for revision</p>
                    </div>

                    <div className="p-8 space-y-6 bg-white">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Deficiency Notes</label>
                            <Textarea
                                placeholder="Specify exact reasons for revision request..."
                                className="form-input min-h-[140px] pt-4 resize-none"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4 pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => setRejectingTask(null)}
                                className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                            >
                                Abort
                            </Button>
                            <Button
                                onClick={handleReject}
                                className="flex-1 h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-rose-100"
                            >
                                Issue Directive
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

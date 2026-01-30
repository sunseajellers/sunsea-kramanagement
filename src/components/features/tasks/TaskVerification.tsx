'use client'

import { useState, useEffect } from 'react'
import { Task } from '@/types'
import { getAllTasks, verifyTask } from '@/lib/taskService'
import {
    CheckCircle2,
    Loader2
} from 'lucide-react'

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
            <div className="flex flex-col items-center justify-center py-32 gap-6">
                <Loader2 className="w-14 h-14 animate-spin text-primary/40" />
                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Checking for new work...</p>
            </div>
        )
    }

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
                <div className="w-24 h-24 rounded-[3.5rem] bg-muted/30 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-muted-foreground/20" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-black text-primary uppercase tracking-tight">All caught up!</h3>
                    <p className="text-muted-foreground/60 text-sm font-medium">All submitted work has been approved or reviewed.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-12 animate-in">
            <div className="page-header flex items-center justify-between">
                <div>
                    <h2 className="section-title">Work Approvals</h2>
                    <p className="section-subtitle">Review and approve work submitted by your team members</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-10">
                {tasks.map(task => (
                    <div
                        key={task.id}
                        className="glass-panel p-0 flex flex-col lg:flex-row items-stretch border-border/40 overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                    >
                        <div className="p-10 space-y-8 flex-1">
                            <div className="flex items-center gap-4">
                                <span className="inline-flex h-7 px-4 items-center rounded-xl bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10 shadow-sm">
                                    {task.taskNumber || 'TASK'}
                                </span>
                                <span className={cn(
                                    "inline-flex h-7 px-4 items-center rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                    task.priority === 'critical' ? "bg-destructive/5 text-destructive border-destructive/10" :
                                        task.priority === 'high' ? "bg-amber-500/5 text-amber-600 border-amber-500/10" : "bg-muted text-muted-foreground/60 border-border"
                                )}>
                                    {task.priority === 'critical' ? 'Urgent' : task.priority} Priority
                                </span>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-primary uppercase tracking-tight group-hover:text-secondary transition-colors">
                                    {task.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-8 text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
                                    <span className="flex items-center gap-2.5">
                                        <div className="w-2 h-2 rounded-full bg-border" />
                                        Assigned To: <span className="text-primary">{task.assignedTo?.join(', ') || 'Nobody'}</span>
                                    </span>
                                    <span className="flex items-center gap-2.5">
                                        <div className="w-2 h-2 rounded-full bg-border" />
                                        Due Date: <span className="text-primary">{new Date(task.dueDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Evidence Box */}
                            <div className="bg-muted/30 p-8 rounded-[2.5rem] border border-border/40 relative overflow-hidden group/proof transition-colors hover:bg-muted/50">
                                <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover/proof:opacity-10">
                                    <CheckCircle2 className="w-16 h-16" />
                                </div>
                                <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] mb-4">Team Member Notes</p>
                                <p className="text-sm font-medium text-primary leading-relaxed italic pr-12">
                                    "{task.proofOfWork || 'No notes provided with this submission.'}"
                                </p>
                                {task.proofLink && (
                                    <div className="mt-8">
                                        <a
                                            href={task.proofLink}
                                            target="_blank"
                                            className="inline-flex items-center px-6 py-3 bg-white rounded-2xl border border-border text-[10px] font-black text-secondary uppercase tracking-[0.2em] hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                                        >
                                            View Attached Link
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Controls Sidebar */}
                        <div className="lg:w-72 bg-muted/20 border-l border-border/20 p-10 flex flex-col gap-4 justify-center">
                            <button
                                onClick={() => setRejectingTask(task)}
                                disabled={!!verifying}
                                className="w-full h-16 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-destructive hover:bg-destructive/5 border-2 border-destructive/10 hover:border-destructive/30 transition-all shadow-sm active:translate-y-0.5"
                            >
                                Needs Changes
                            </button>
                            <button
                                onClick={() => handleVerify(task.id)}
                                disabled={!!verifying}
                                className="w-full h-16 btn-primary shadow-xl shadow-primary/10"
                            >
                                {verifying === task.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Approve Work'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Rejection Interface Overlay */}
            <Dialog open={!!rejectingTask} onOpenChange={(open) => !open && setRejectingTask(null)}>
                <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden border-none rounded-[3.5rem] shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                    <div className="bg-destructive px-12 py-16 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <CheckCircle2 className="w-32 h-32 rotate-12" />
                        </div>
                        <h2 className="text-4xl font-black tracking-tight uppercase mb-2">Request Changes</h2>
                        <p className="text-rose-100 text-[10px] font-black uppercase tracking-[0.4em]">Tell the team member what needs fixing</p>
                    </div>

                    <div className="p-12 space-y-10 bg-white">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.3em] ml-2">What needs to change?</label>
                            <Textarea
                                placeholder="Write your instructions for the team member here..."
                                className="form-input min-h-[160px] p-6 resize-none"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-6 pt-4">
                            <button
                                onClick={() => setRejectingTask(null)}
                                className="flex-1 h-16 rounded-2xl font-black text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted/50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                className="flex-1 h-16 bg-destructive text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-destructive/20 active:translate-y-0.5"
                            >
                                Send Request
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

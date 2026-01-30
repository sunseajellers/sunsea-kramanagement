'use client';

import { useState } from 'react';
import { Task } from '@/types';
import { verifyTask } from '@/lib/taskService';
import { format } from 'date-fns';
import {
    Check,
    X,
    Loader2,
    CheckSquare,
    ExternalLink,
    User,
    Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
    tasks: Task[];
    onVerificationComplete: () => void;
}

export default function AdminVerificationQueue({ tasks, onVerificationComplete }: Props) {
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectingTaskId, setRejectingTaskId] = useState<string | null>(null);

    // Filter for tasks that are awaiting review or completed but pending verification
    const pendingTasks = tasks.filter(t =>
        t.status === 'pending_review' ||
        (t.verificationStatus === 'pending' || (t.status === 'completed' && !t.verificationStatus))
    );

    const handleVerify = async (taskId: string) => {
        setProcessingId(taskId);
        try {
            await verifyTask(taskId, 'verified');
            toast.success('Task verified successfully');
            onVerificationComplete();
        } catch (error) {
            console.error('Verification failed', error);
            toast.error('Failed to verify task');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (taskId: string) => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        setProcessingId(taskId);
        try {
            await verifyTask(taskId, 'rejected', rejectionReason);
            setRejectingTaskId(null);
            setRejectionReason('');
            toast.success('Revision requested');
            onVerificationComplete();
        } catch (error) {
            console.error('Rejection failed', error);
            toast.error('Failed to reject task');
        } finally {
            setProcessingId(null);
        }
    };

    if (pendingTasks.length === 0) {
        return (
            <div className="glass-panel border-dashed border-4 border-border/40 bg-muted/5 py-32 text-center rounded-[3.5rem] hover:border-secondary/20 hover:bg-muted/10 transition-all duration-700 group/queue animate-in">
                <div className="w-24 h-24 rounded-[3rem] bg-white border border-border flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/5 group-hover/queue:scale-110 transition-transform duration-700">
                    <CheckSquare className="w-12 h-12 text-muted-foreground/20 group-hover/queue:text-secondary transition-colors" />
                </div>
                <div className="space-y-3">
                    <h3 className="text-2xl font-black text-primary uppercase tracking-tight">All Caught Up!</h3>
                    <p className="text-sm text-muted-foreground/50 font-medium max-w-xs mx-auto uppercase tracking-widest leading-relaxed">
                        No work is waiting for approval. Everything is reviewed and up to date.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in">
            <div className="page-header flex items-center justify-between">
                <div>
                    <h2 className="section-title">Work Approvals</h2>
                    <p className="section-subtitle">Review and approve work submitted by your team members</p>
                </div>
                <div className="status-badge bg-primary text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-primary/10 tracking-[0.2em] uppercase text-[10px]">
                    {pendingTasks.length} WAITING
                </div>
            </div>

            <div className="grid grid-cols-1 gap-10">
                {pendingTasks.map(task => (
                    <div key={task.id} className="glass-panel group p-0 overflow-hidden border-border/40 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                        <div className="flex flex-col xl:flex-row items-stretch">
                            <div className="flex-1 p-10 space-y-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-5">
                                        <span className="px-5 py-2 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border border-primary/10">
                                            {task.taskNumber || 'TASK'}
                                        </span>
                                        <h3 className="text-3xl font-black text-primary transition-colors group-hover:text-secondary uppercase tracking-tight">
                                            {task.title}
                                        </h3>
                                    </div>

                                    {task.description && (
                                        <p className="text-base text-muted-foreground/60 font-medium leading-relaxed max-w-4xl italic">
                                            "{task.description}"
                                        </p>
                                    )}
                                </div>

                                {/* Evidence of Work */}
                                {(task.proofOfWork || task.proofLink) && (
                                    <div className="bg-muted/30 rounded-[3rem] p-10 border border-border/40 space-y-8 relative overflow-hidden group/proof transition-colors hover:bg-muted/50">
                                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] -rotate-12 pointer-events-none group-hover/proof:scale-110 transition-transform duration-700">
                                            <CheckSquare className="w-32 h-32 text-primary" />
                                        </div>
                                        <div className="flex items-center gap-5 text-[10px] font-black text-secondary uppercase tracking-[0.3em] relative">
                                            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-border">
                                                <CheckSquare className="w-5 h-5" />
                                            </div>
                                            Evidence Submitted
                                        </div>
                                        {task.proofOfWork && (
                                            <p className="text-xl text-primary font-bold leading-relaxed relative pl-1">
                                                {task.proofOfWork}
                                            </p>
                                        )}
                                        {task.proofLink && (
                                            <div className="relative pt-4">
                                                <a
                                                    href={task.proofLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="h-14 px-8 inline-flex items-center gap-3 bg-white border border-border rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                                                >
                                                    View Shared Link <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-10 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">
                                    <span className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-muted/20 flex items-center justify-center border border-border/40">
                                            <User className="w-5 h-5 text-secondary" />
                                        </div>
                                        <span>Sent By: <span className="text-primary">{task.assignedTo?.join(', ') || 'Unknown'}</span></span>
                                    </span>
                                    <span className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-muted/20 flex items-center justify-center border border-border/40">
                                            <Calendar className="w-5 h-5 text-secondary" />
                                        </div>
                                        <span>Due Date: <span className="text-primary">{task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'No date'}</span></span>
                                    </span>
                                </div>
                            </div>

                            <div className="xl:w-80 bg-muted/20 border-l border-border/20 p-10 flex flex-col justify-center gap-4">
                                {rejectingTaskId === task.id ? (
                                    <div className="flex flex-col gap-6 bg-destructive/5 p-8 rounded-[2.5rem] border-2 border-destructive/10 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-destructive uppercase tracking-[0.3em] ml-2">What needs fixing?</label>
                                            <textarea
                                                placeholder="Write your instructions here..."
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                className="form-input h-32 p-5 resize-none bg-white/50"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setRejectingTaskId(null)}
                                                className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleReject(task.id)}
                                                disabled={!!processingId}
                                                className="flex-1 h-12 bg-destructive text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 flex items-center justify-center gap-3 shadow-xl shadow-destructive/10 transition-all active:translate-y-0.5"
                                            >
                                                {processingId === task.id && <Loader2 className="w-4 h-4 animate-spin" />}
                                                Send
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleVerify(task.id)}
                                            disabled={!!processingId}
                                            className="btn-primary h-20 w-full shadow-xl shadow-primary/10"
                                        >
                                            {processingId === task.id ? (
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            ) : (
                                                <>
                                                    <Check className="w-5 h-5" />
                                                    Approve Work
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setRejectingTaskId(task.id)}
                                            disabled={!!processingId}
                                            className="h-20 w-full bg-white border border-border text-muted-foreground rounded-2xl hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 flex items-center justify-center gap-4 transition-all duration-500 font-black text-[10px] uppercase tracking-[0.3em] shadow-sm active:translate-y-0.5"
                                        >
                                            <X className="w-5 h-5" />
                                            Needs Changes
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

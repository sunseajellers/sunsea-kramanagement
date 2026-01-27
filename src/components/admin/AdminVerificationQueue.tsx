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
            <div className="glass-panel border-dashed border-4 border-slate-100 bg-slate-50/30 py-32 text-center rounded-[3.5rem] hover:border-emerald-100 hover:bg-emerald-50/20 transition-all duration-700 group/queue animate-in">
                <div className="w-24 h-24 rounded-[3rem] bg-white border border-slate-100 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-100/20 group-hover/queue:scale-110 transition-transform duration-700">
                    <CheckSquare className="w-12 h-12 text-slate-200 group-hover/queue:text-emerald-500 transition-colors" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Queue Operational</h3>
                    <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto uppercase tracking-widest leading-relaxed">
                        No pending tactical validations required. System at peak efficiency.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in">
            <div className="page-header flex items-center justify-between">
                <div>
                    <h2 className="section-title">Verification Protocol</h2>
                    <p className="section-subtitle">Audit and authorize completed tactical objectives</p>
                </div>
                <div className="bg-indigo-600 text-white text-[12px] h-10 px-5 flex items-center rounded-[1.25rem] font-black shadow-xl shadow-indigo-100">
                    {pendingTasks.length} PENDING
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {pendingTasks.map(task => (
                    <div key={task.id} className="glass-panel group p-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                        <div className="flex flex-col xl:flex-row justify-between items-start gap-10">
                            <div className="flex-1 space-y-6">
                                <div className="flex items-center gap-4">
                                    <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg">
                                        {task.taskNumber || 'T-XXX'}
                                    </span>
                                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-tight">
                                        {task.title}
                                    </h3>
                                </div>

                                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-3xl italic">
                                    {task.description}
                                </p>

                                {/* Proof of Work */}
                                {(task.proofOfWork || task.proofLink) && (
                                    <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100 space-y-4 relative overflow-hidden group/proof">
                                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] -rotate-12 pointer-events-none group-hover/proof:scale-110 transition-transform">
                                            <CheckSquare className="w-24 h-24" />
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] relative">
                                            <CheckSquare className="w-5 h-5" />
                                            Personnel Submission Data
                                        </div>
                                        {task.proofOfWork && (
                                            <p className="text-base text-slate-600 font-bold leading-relaxed relative">
                                                "{task.proofOfWork}"
                                            </p>
                                        )}
                                        {task.proofLink && (
                                            <div className="relative">
                                                <a
                                                    href={task.proofLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-3 text-[10px] font-black text-indigo-600 bg-white hover:bg-indigo-600 hover:text-white px-6 py-3 rounded-2xl border-2 border-indigo-100 transition-all shadow-sm"
                                                >
                                                    EXTERNAL ARTIFACT <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    <span className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm"><User className="w-4 h-4 text-indigo-500" /> {task.assignedTo?.join(', ') || 'UNASSIGNED'}</span>
                                    <span className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm"><Calendar className="w-4 h-4 text-indigo-500" /> {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'NO DATE'}</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row xl:flex-col gap-4 shrink-0 sm:w-full xl:w-[320px]">
                                {rejectingTaskId === task.id ? (
                                    <div className="flex flex-col gap-5 bg-rose-50/30 p-8 rounded-[2.5rem] border-2 border-rose-100 animate-in zoom-in-95 duration-300">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] ml-1">Calibration Directives</label>
                                            <textarea
                                                placeholder="Specify necessary adjustments..."
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                className="form-input h-32 py-4 resize-none bg-white border-rose-100 focus:ring-rose-200"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setRejectingTaskId(null)}
                                                className="flex-1 h-14 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                Abort
                                            </button>
                                            <button
                                                onClick={() => handleReject(task.id)}
                                                disabled={!!processingId}
                                                className="flex-1 h-14 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-[1.25rem] hover:bg-rose-700 flex items-center justify-center gap-3 shadow-xl shadow-rose-100 transition-all border-none"
                                            >
                                                {processingId === task.id && <Loader2 className="w-4 h-4 animate-spin" />}
                                                CONFIRM REJECTION
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleVerify(task.id)}
                                            disabled={!!processingId}
                                            className="btn-primary h-16 w-full text-[11px] tracking-[0.2em]"
                                        >
                                            {processingId === task.id ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Check className="w-6 h-6 mr-2" />
                                            )}
                                            AUTHORIZE OBJECTIVE
                                        </button>
                                        <button
                                            onClick={() => setRejectingTaskId(task.id)}
                                            disabled={!!processingId}
                                            className="h-16 w-full bg-white border-2 border-slate-100 text-slate-600 rounded-[1.5rem] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 flex items-center justify-center gap-3 transition-all duration-300 text-[11px] font-black uppercase tracking-[0.2em] shadow-sm"
                                        >
                                            <X className="w-5 h-5" />
                                            REVISION REQUIRED
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

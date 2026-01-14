'use client';

import { useState } from 'react';
import { Task } from '@/types';
import { verifyTask } from '@/lib/taskService';
import { format } from 'date-fns';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';

interface Props {
    tasks: Task[];
    onVerificationComplete: () => void;
}

export default function AdminVerificationQueue({ tasks, onVerificationComplete }: Props) {
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectingTaskId, setRejectingTaskId] = useState<string | null>(null);

    // Filter for tasks that are 'completed' but validationStatus is 'pending' or undefined
    const pendingTasks = tasks.filter(t =>
        t.status === 'completed' &&
        (t.verificationStatus === 'pending' || !t.verificationStatus)
    );

    const handleVerify = async (taskId: string) => {
        setProcessingId(taskId);
        try {
            await verifyTask(taskId, 'verified');
            onVerificationComplete();
        } catch (error) {
            console.error('Verification failed', error);
            alert('Failed to verify task');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (taskId: string) => {
        if (!rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        setProcessingId(taskId);
        try {
            await verifyTask(taskId, 'rejected', rejectionReason);
            setRejectingTaskId(null);
            setRejectionReason('');
            onVerificationComplete();
        } catch (error) {
            console.error('Rejection failed', error);
            alert('Failed to reject task');
        } finally {
            setProcessingId(null);
        }
    };

    if (pendingTasks.length === 0) {
        return (
            <div className="p-8 text-center bg-green-50 rounded-xl border border-green-100">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-green-900">All Clear!</h3>
                <p className="text-green-700">No completed tasks pending verification.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-500" />
                Pending Verification ({pendingTasks.length})
            </h2>

            <div className="space-y-3">
                {pendingTasks.map(task => (
                    <div key={task.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-mono rounded">
                                        {task.taskNumber || 'ID-???'}
                                    </span>
                                    <h3 className="font-semibold text-slate-900">{task.title}</h3>
                                </div>
                                <p className="text-sm text-slate-600 mb-2 line-clamp-2">{task.description}</p>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <span>👤 Assignee: {task.assignedTo?.join(', ')}</span>
                                    <span>📅 Due: {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : '-'}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {rejectingTaskId === task.id ? (
                                    <div className="flex flex-col gap-2 min-w-[200px] bg-red-50 p-3 rounded-lg animate-fade-in">
                                        <textarea
                                            placeholder="Reason for rejection..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            className="text-sm p-2 border border-red-200 rounded focus:border-red-500 outline-none"
                                            rows={2}
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setRejectingTaskId(null)}
                                                className="text-xs text-slate-500 hover:text-slate-800"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleReject(task.id)}
                                                disabled={!!processingId}
                                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 flex items-center gap-1"
                                            >
                                                {processingId === task.id && <Loader2 className="w-3 h-3 animate-spin" />}
                                                Confirm Reject
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setRejectingTaskId(task.id)}
                                            disabled={!!processingId}
                                            className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1 transition-colors text-sm font-medium"
                                        >
                                            <X className="w-4 h-4" />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleVerify(task.id)}
                                            disabled={!!processingId}
                                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 transition-colors text-sm font-medium shadow-sm shadow-green-200"
                                        >
                                            {processingId === task.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Check className="w-4 h-4" />
                                            )}
                                            Approve
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

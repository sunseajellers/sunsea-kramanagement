'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LeaveType } from '@/types';
import { submitLeaveRequest } from '@/lib/hrService';
import { Calendar } from '@/components/ui/calendar';
import { differenceInBusinessDays } from 'date-fns';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId: string;
    userName: string;
}

export default function LeaveRequestModal({ isOpen, onClose, onSuccess, userId, userName }: Props) {
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    });
    const [type, setType] = useState<LeaveType>('casual');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!dateRange.from || !dateRange.to || !reason) {
            toast.error('Please fill in all fields');
            return;
        }

        setSubmitting(true);
        try {
            const daysCount = differenceInBusinessDays(dateRange.to, dateRange.from) + 1;

            await submitLeaveRequest({
                userId,
                userName,
                leaveType: type,
                startDate: dateRange.from,
                endDate: dateRange.to,
                daysCount,
                reason
            });

            toast.success('Leave request submitted');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Request Leave</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Leave Type</label>
                            <select
                                className="form-input w-full"
                                value={type}
                                onChange={(e) => setType(e.target.value as LeaveType)}
                            >
                                <option value="casual">Casual Leave</option>
                                <option value="sick">Sick Leave</option>
                                <option value="earned">Earned Leave</option>
                                <option value="unpaid">Unpaid Leave</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Total Days</label>
                            <div className="form-input bg-slate-50 flex items-center justify-center font-bold text-slate-900">
                                {dateRange.from && dateRange.to
                                    ? differenceInBusinessDays(dateRange.to, dateRange.from) + 1
                                    : '-'}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Select Dates</label>
                        <div className="border rounded-md p-2 flex justify-center">
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={(range: any) => setDateRange(range)}
                                className="rounded-md border"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Reason</label>
                        <textarea
                            className="form-input w-full h-20 resize-none"
                            placeholder="Brief reason for your leave..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting} className="btn-primary">
                        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Submit Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

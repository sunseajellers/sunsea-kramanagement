'use client';

import { LeaveRequest } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface Props {
    requests: LeaveRequest[];
}

export default function LeaveCalendar({ requests }: Props) {
    // For simplicity, we just show a list for now, but in a real app this would be a full grid
    // For this dashboard view, let's make it a nice customized list of upcoming leaves

    // Sort by start date
    const upcomingLeaves = requests
        .filter(r => new Date(r.startDate) >= new Date()) // Future only
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 5); // Take top 5

    return (
        <div className="space-y-4">
            {upcomingLeaves.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                    <p className="text-sm">No upcoming leaves scheduled</p>
                </div>
            ) : (
                upcomingLeaves.map(leave => (
                    <div key={leave.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex flex-col items-center bg-white p-2 rounded-lg shadow-sm border border-slate-100 min-w-[60px]">
                            <span className="text-xs font-bold text-slate-400 uppercase">
                                {format(new Date(leave.startDate), 'MMM')}
                            </span>
                            <span className="text-xl font-black text-slate-900">
                                {format(new Date(leave.startDate), 'dd')}
                            </span>
                        </div>

                        <div className="flex-1">
                            <div className="flex justify-between">
                                <h4 className="font-bold text-slate-900 text-sm">{leave.userName}</h4>
                                <span className={cn(
                                    "text-[10px] uppercase font-black px-2 py-0.5 rounded-full",
                                    leave.status === 'approved' ? "bg-emerald-100 text-emerald-600" :
                                        leave.status === 'pending' ? "bg-amber-100 text-amber-600" :
                                            "bg-rose-100 text-rose-600"
                                )}>
                                    {leave.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {leave.daysCount} days • {leave.type}
                                </span>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

'use client'

import { Ticket, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import type { TicketStats } from '@/types'

interface Props {
    stats: TicketStats
    loading?: boolean
}

export function TicketStatsCards({ stats, loading = false }: Props) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="stat-card animate-pulse">
                        <div className="h-16 bg-slate-100 rounded-xl w-full"></div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-8">
            {/* Total Tickets */}
            <div className="dashboard-card group">
                <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                        <Ticket className="w-7 h-7" />
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em]">Total Requests</p>
                    <h3 className="text-4xl font-black text-primary transition-colors group-hover:text-secondary">{stats.total}</h3>
                    <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">SUBMITTED</p>
                </div>
            </div>

            {/* Open Tickets */}
            <div className="dashboard-card group">
                <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm group-hover:scale-110 transition-transform">
                        <AlertCircle className="w-7 h-7" />
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em]">Pending Action</p>
                    <h3 className="text-4xl font-black text-rose-600">{stats.open}</h3>
                    <p className="text-[9px] font-black text-rose-500/40 uppercase tracking-widest">
                        {stats.total > 0 ? Math.round((stats.open / stats.total) * 100) : 0}% URGENCY
                    </p>
                </div>
            </div>

            {/* In Progress */}
            <div className="dashboard-card group">
                <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm group-hover:scale-110 transition-transform">
                        <Clock className="w-7 h-7" />
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em]">Being Fixed</p>
                    <h3 className="text-4xl font-black text-amber-600">{stats.inProgress}</h3>
                    <p className="text-[9px] font-black text-amber-500/40 uppercase tracking-widest">
                        {stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}% ACTIVE
                    </p>
                </div>
            </div>

            {/* Resolved */}
            <div className="dashboard-card group">
                <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-sm group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-7 h-7" />
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em]">Success Rate</p>
                    <h3 className="text-4xl font-black text-emerald-600">{stats.resolved}</h3>
                    <p className="text-[9px] font-black text-emerald-500/40 uppercase tracking-widest">
                        {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}% DONE
                    </p>
                </div>
            </div>

            {/* Avg Resolution Time */}
            <div className="dashboard-card group">
                <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm group-hover:scale-110 transition-transform">
                        <Clock className="w-7 h-7" />
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em]">Effectiveness</p>
                    <h3 className="text-4xl font-black text-purple-600">{stats.avgResolutionTime.toFixed(1)}h</h3>
                    <p className="text-[9px] font-black text-purple-500/40 uppercase tracking-widest">AVG RESPONSE</p>
                </div>
            </div>
        </div>
    )
}

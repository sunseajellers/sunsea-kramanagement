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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Total Tickets */}
            <div className="stat-card">
                <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tickets</p>
                    <h3 className="text-2xl font-black text-slate-900">{stats.total}</h3>
                </div>
                <div className="icon-box icon-box-md bg-blue-50 text-blue-600">
                    <Ticket className="w-5 h-5" />
                </div>
            </div>

            {/* Open Tickets */}
            <div className="stat-card border-l-4 border-l-red-500">
                <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Open</p>
                    <h3 className="text-2xl font-black text-slate-900">{stats.open}</h3>
                    <p className="text-[9px] text-slate-400 font-bold">
                        {stats.total > 0 ? Math.round((stats.open / stats.total) * 100) : 0}% URGENCY RATE
                    </p>
                </div>
                <div className="icon-box icon-box-md bg-red-50 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                </div>
            </div>

            {/* In Progress */}
            <div className="stat-card border-l-4 border-l-amber-500">
                <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Processing</p>
                    <h3 className="text-2xl font-black text-slate-900">{stats.inProgress}</h3>
                    <p className="text-[9px] text-slate-400 font-bold">
                        {stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}% ACTIVE LOAD
                    </p>
                </div>
                <div className="icon-box icon-box-md bg-amber-50 text-amber-600">
                    <Clock className="w-5 h-5" />
                </div>
            </div>

            {/* Resolved */}
            <div className="stat-card border-l-4 border-l-emerald-500">
                <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Resolved</p>
                    <h3 className="text-2xl font-black text-slate-900">{stats.resolved}</h3>
                    <p className="text-[9px] text-slate-400 font-bold">
                        {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}% COMPLETION
                    </p>
                </div>
                <div className="icon-box icon-box-md bg-emerald-50 text-emerald-600">
                    <CheckCircle className="w-5 h-5" />
                </div>
            </div>

            {/* Avg Resolution Time */}
            <div className="stat-card border-l-4 border-l-purple-500">
                <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Efficiency</p>
                    <h3 className="text-2xl font-black text-slate-900">{stats.avgResolutionTime.toFixed(1)}h</h3>
                    <p className="text-[9px] text-slate-400 font-bold">AVG RESPONSE</p>
                </div>
                <div className="icon-box icon-box-md bg-purple-50 text-purple-600">
                    <Clock className="w-5 h-5" />
                </div>
            </div>
        </div>
    )
}

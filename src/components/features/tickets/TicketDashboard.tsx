'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'
import type { Ticket, TicketStats, TicketStatus } from '@/types'
import { TicketStatsCards } from './TicketStatsCards'
import { TicketList } from './TicketList'
import { CreateTicketModal } from './CreateTicketModal'
import { TicketDetailModal } from './TicketDetailModal'
import { toast } from 'sonner'
import { authenticatedJsonFetch } from '@/lib/apiClient'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

export function TicketDashboard() {
    const { isAdmin } = useAuth()
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [stats, setStats] = useState<TicketStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
    const [filter, setFilter] = useState<TicketStatus | 'all'>('all')

    useEffect(() => {
        fetchTickets()
        fetchStats()
    }, [filter])

    const fetchTickets = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (filter !== 'all') {
                params.append('status', filter)
            }

            const result = await authenticatedJsonFetch(`/api/tickets?${params}`)
            if (result.success) {
                setTickets(result.data)
            } else {
                throw new Error(result.error)
            }
        } catch (error) {
            console.error('Error fetching tickets:', error)
            toast.error('Failed to load tickets')
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const result = await authenticatedJsonFetch('/api/tickets/stats')
            if (result.success) {
                setStats(result.data)
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    const handleCreateSuccess = () => {
        setIsCreateModalOpen(false)
        fetchTickets()
        fetchStats()
    }

    const handleTicketUpdate = () => {
        fetchTickets()
        fetchStats()
        setSelectedTicket(null)
    }

    const handleRefresh = () => {
        fetchTickets()
        fetchStats()
        toast.success('Tickets refreshed')
    }

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="section-title">Support Intelligence</h1>
                    <p className="section-subtitle">Infrastructure support, service requests, and resolution tracking</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="btn-secondary"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Sync Data
                    </Button>
                    <Button onClick={() => setIsCreateModalOpen(true)} className="btn-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Initialize Ticket
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && <TicketStatsCards stats={stats} loading={loading} />}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-100/40 p-2 rounded-2xl border border-slate-200/50">
                <div className="flex bg-white/50 p-1.5 rounded-xl shadow-sm border border-slate-200/50 overflow-x-auto scrollbar-none">
                    <button
                        onClick={() => setFilter('all')}
                        className={cn(
                            "px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all min-w-max",
                            filter === 'all' ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        All Requests
                    </button>
                    <button
                        onClick={() => setFilter('open')}
                        className={cn(
                            "px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-3 min-w-max",
                            filter === 'open' ? "bg-rose-50 text-rose-600 shadow-sm border border-rose-200" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Open
                        {stats && stats.open > 0 && (
                            <span className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-black",
                                filter === 'open' ? "bg-rose-100" : "bg-slate-100"
                            )}>
                                {stats.open}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilter('in_progress')}
                        className={cn(
                            "px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-3 min-w-max",
                            filter === 'in_progress' ? "bg-amber-50 text-amber-600 shadow-sm border border-amber-200" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Processing
                        {stats && stats.inProgress > 0 && (
                            <span className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-black",
                                filter === 'in_progress' ? "bg-amber-100" : "bg-slate-100"
                            )}>
                                {stats.inProgress}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilter('resolved')}
                        className={cn(
                            "px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-3 min-w-max",
                            filter === 'resolved' ? "bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-200" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Resolved
                        {stats && stats.resolved > 0 && (
                            <span className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-black",
                                filter === 'resolved' ? "bg-emerald-100" : "bg-slate-100"
                            )}>
                                {stats.resolved}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilter('closed')}
                        className={cn(
                            "px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all min-w-max",
                            filter === 'closed' ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Archived
                    </button>
                </div>

                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:block">Support Ledger V2.6</p>
            </div>

            {/* Ticket List */}
            <TicketList
                tickets={tickets}
                loading={loading}
                onRefresh={handleRefresh}
                onTicketClick={setSelectedTicket}
            />

            {/* Create Modal */}
            <CreateTicketModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />

            {/* Detail Modal */}
            <TicketDetailModal
                ticket={selectedTicket}
                open={!!selectedTicket}
                onClose={() => setSelectedTicket(null)}
                onUpdate={handleTicketUpdate}
                isAdmin={isAdmin}
            />
        </div>
    )
}

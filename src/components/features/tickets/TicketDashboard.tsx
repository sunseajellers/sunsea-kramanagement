'use client'

import { useState, useEffect } from 'react'

import { Plus, RefreshCw, History, Zap, Clock, CheckCircle2, Lock } from 'lucide-react'
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
    const { user, isAdmin } = useAuth()
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
        if (!user) return
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (filter !== 'all') {
                params.append('status', filter)
            }
            if (!isAdmin) {
                params.append('requesterId', user.uid)
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
        if (!user) return
        try {
            const params = new URLSearchParams()
            if (!isAdmin) {
                params.append('requesterId', user.uid)
            }
            const result = await authenticatedJsonFetch(`/api/tickets/stats?${params}`)
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
        <div className="space-y-12 animate-in">
            {/* Header */}
            <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div>
                    <h1 className="section-title">Support Desk</h1>
                    <p className="section-subtitle">Technical assistance, facility requests, and grievance management</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="btn-secondary h-12 md:h-14 px-4 md:px-6"
                    >
                        <RefreshCw className={cn("w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3", loading && "animate-spin")} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary h-12 md:h-14 px-6 md:px-8">
                        <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" />
                        <span className="whitespace-nowrap">New Request</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && <TicketStatsCards stats={stats} loading={loading} />}

            {/* Filters - Single Line Dock with Icons (Optimized for no-scroll) */}
            <div className="glass-panel p-1.5 border-border/40 overflow-hidden">
                <div className="flex bg-muted/30 p-1 rounded-2xl border border-border/40 gap-1 sm:gap-2 justify-between">
                    <button
                        onClick={() => setFilter('all')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all",
                            filter === 'all' ? "bg-white text-primary shadow-sm border border-border" : "text-muted-foreground/60 hover:text-primary"
                        )}
                        title="History"
                    >
                        <History className="w-4 h-4" />
                        <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">History</span>
                    </button>
                    <button
                        onClick={() => setFilter('open')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all relative",
                            filter === 'open' ? "bg-rose-50 text-rose-600 shadow-sm border border-rose-100" : "text-muted-foreground/60 hover:text-primary"
                        )}
                        title="New"
                    >
                        <Zap className="w-4 h-4" />
                        <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">New</span>
                        {stats && stats.open > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white shadow-sm">
                                {stats.open}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilter('in_progress')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all relative",
                            filter === 'in_progress' ? "bg-amber-50 text-amber-600 shadow-sm border border-amber-100" : "text-muted-foreground/60 hover:text-primary"
                        )}
                        title="In Work"
                    >
                        <Clock className="w-4 h-4" />
                        <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">In Work</span>
                        {stats && stats.inProgress > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[8px] font-black text-white shadow-sm">
                                {stats.inProgress}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilter('resolved')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all relative",
                            filter === 'resolved' ? "bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100" : "text-muted-foreground/60 hover:text-primary"
                        )}
                        title="Fixed"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Fixed</span>
                        {stats && stats.resolved > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-emerald-500 px-1 text-[8px] font-black text-white shadow-sm">
                                {stats.resolved}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilter('closed')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all",
                            filter === 'closed' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground/60 hover:text-primary"
                        )}
                        title="Closed"
                    >
                        <Lock className="w-4 h-4" />
                        <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Closed</span>
                    </button>
                </div>
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

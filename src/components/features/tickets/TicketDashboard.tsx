'use client'

import { useState, useEffect } from 'react'

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
                    <h1 className="section-title">Help & Support</h1>
                    <p className="section-subtitle">Need help with something? Submit a request and we'll handle it.</p>
                </div>
                <div className="flex items-center gap-5">
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="btn-secondary h-14"
                    >
                        <RefreshCw className={cn("w-5 h-5 mr-3", loading && "animate-spin")} />
                        Refresh
                    </button>
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary h-14 px-8">
                        <Plus className="w-5 h-5 mr-3" />
                        New Request
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && <TicketStatsCards stats={stats} loading={loading} />}

            {/* Filters */}
            <div className="glass-panel p-2 flex flex-col sm:flex-row items-center justify-between gap-8 border-border/40">
                <div className="flex bg-muted/30 p-1.5 rounded-[1.5rem] border border-border/40 overflow-x-auto scrollbar-none w-full sm:w-auto">
                    <button
                        onClick={() => setFilter('all')}
                        className={cn(
                            "px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all min-w-max",
                            filter === 'all' ? "bg-white text-primary shadow-sm border border-border" : "text-muted-foreground/60 hover:text-primary"
                        )}
                    >
                        History
                    </button>
                    <button
                        onClick={() => setFilter('open')}
                        className={cn(
                            "px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-3 min-w-max",
                            filter === 'open' ? "bg-rose-50 text-rose-600 shadow-sm border border-rose-100" : "text-muted-foreground/60 hover:text-primary"
                        )}
                    >
                        New
                        {stats && stats.open > 0 && (
                            <span className={cn(
                                "px-2.5 py-1 rounded-lg text-[9px] font-black",
                                filter === 'open' ? "bg-rose-100" : "bg-muted/50"
                            )}>
                                {stats.open}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilter('in_progress')}
                        className={cn(
                            "px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-3 min-w-max",
                            filter === 'in_progress' ? "bg-amber-50 text-amber-600 shadow-sm border border-amber-100" : "text-muted-foreground/60 hover:text-primary"
                        )}
                    >
                        In Work
                        {stats && stats.inProgress > 0 && (
                            <span className={cn(
                                "px-2.5 py-1 rounded-lg text-[9px] font-black",
                                filter === 'in_progress' ? "bg-amber-100" : "bg-muted/50"
                            )}>
                                {stats.inProgress}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilter('resolved')}
                        className={cn(
                            "px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-3 min-w-max",
                            filter === 'resolved' ? "bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100" : "text-muted-foreground/60 hover:text-primary"
                        )}
                    >
                        Fixed
                        {stats && stats.resolved > 0 && (
                            <span className={cn(
                                "px-2.5 py-1 rounded-lg text-[9px] font-black",
                                filter === 'resolved' ? "bg-emerald-100" : "bg-muted/50"
                            )}>
                                {stats.resolved}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilter('closed')}
                        className={cn(
                            "px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all min-w-max",
                            filter === 'closed' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground/60 hover:text-primary"
                        )}
                    >
                        Closed
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

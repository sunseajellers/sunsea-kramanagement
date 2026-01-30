'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Ticket } from '@/types'
import {
    Clock,
    User,
    Calendar,
    AlertCircle,
    CheckCircle,
    XCircle,
    Loader2
} from 'lucide-react'
import { format } from 'date-fns'

interface Props {
    tickets: Ticket[]
    loading?: boolean
    onRefresh: () => void
    onTicketClick: (ticket: Ticket) => void
}

export function TicketList({ tickets, loading = false, onRefresh, onTicketClick }: Props) {
    const getStatusBadge = (status: string) => {
        const variants = {
            open: { variant: 'destructive' as const, icon: AlertCircle, label: 'Open', className: '' },
            in_progress: { variant: 'default' as const, icon: Clock, label: 'In Progress', className: '' },
            resolved: { variant: 'default' as const, icon: CheckCircle, label: 'Resolved', className: 'bg-green-500' },
            closed: { variant: 'secondary' as const, icon: XCircle, label: 'Closed', className: '' }
        }

        const config = variants[status as keyof typeof variants] || variants.open
        const Icon = config.icon

        return (
            <Badge variant={config.variant} className={config.className || undefined}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
            </Badge>
        )
    }

    const getPriorityBadge = (priority: string) => {
        const colors = {
            low: 'bg-green-100 text-green-800 border-green-300',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            high: 'bg-orange-100 text-orange-800 border-orange-300',
            critical: 'bg-red-100 text-red-800 border-red-300'
        }

        const labels = {
            low: '🟢 Low',
            medium: '🟡 Medium',
            high: '🔴 High',
            critical: '🚨 Critical'
        }

        return (
            <Badge variant="outline" className={colors[priority as keyof typeof colors]}>
                {labels[priority as keyof typeof labels]}
            </Badge>
        )
    }

    const getRequestTypeLabel = (type: string) => {
        const labels = {
            question: '❓ Question',
            problem: '⚠️ Problem',
            incident: '🚨 Incident',
            feature_request: '💡 Feature Request',
            office_stationery: '📦 Office Stationery'
        }
        return labels[type as keyof typeof labels] || type
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (tickets.length === 0) {
        return (
            <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-muted rounded-full">
                        <AlertCircle className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">No tickets found</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Try adjusting your filters or create a new ticket
                        </p>
                    </div>
                    <Button onClick={onRefresh} variant="outline">
                        Refresh
                    </Button>
                </div>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {tickets.map((ticket) => (
                <div
                    key={ticket.id}
                    className="glass-panel p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer group border-border/40"
                    onClick={() => onTicketClick(ticket)}
                >
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
                        <div className="flex-1 min-w-0 space-y-4">
                            <div className="flex items-center gap-4">
                                <span className="px-4 py-1.5 rounded-xl bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
                                    {ticket.ticketNumber}
                                </span>
                                <h3 className="text-2xl font-black text-primary group-hover:text-secondary transition-colors uppercase tracking-tight truncate">
                                    {ticket.subject}
                                </h3>
                            </div>

                            <p className="text-sm text-muted-foreground/70 font-medium leading-relaxed italic line-clamp-2 max-w-3xl">
                                {ticket.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-8 py-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                                        <User className="w-4 h-4 text-muted-foreground/60" />
                                    </div>
                                    <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{ticket.requesterName}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                                        <Calendar className="w-4 h-4 text-muted-foreground/60" />
                                    </div>
                                    <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Due {format(new Date(ticket.dueDate), 'MMM dd')}</span>
                                </div>
                                <div className="px-4 py-1.5 rounded-xl bg-muted/20 text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest border border-border/40">
                                    {getRequestTypeLabel(ticket.requestType)}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-row xl:flex-col items-center xl:items-end gap-6 border-t xl:border-t-0 pt-6 xl:pt-0 border-border/20">
                            <div className="flex items-center gap-3">
                                {getPriorityBadge(ticket.priority)}
                                {getStatusBadge(ticket.status)}
                            </div>
                            <button className="btn-secondary h-12 px-8 text-[10px] tracking-[0.2em] font-black">
                                VIEW DETAILS
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

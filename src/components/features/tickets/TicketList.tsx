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
    Loader2,
    Eye
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
        <div className="space-y-3">
            {tickets.map((ticket) => (
                <Card
                    key={ticket.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onTicketClick(ticket)}
                >
                    <div className="flex items-start justify-between gap-4">
                        {/* Left: Ticket Info */}
                        <div className="flex-1 min-w-0">
                            {/* Ticket Number & Subject */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-sm font-semibold text-muted-foreground">
                                    {ticket.ticketNumber}
                                </span>
                                <h3 className="font-semibold text-lg truncate">
                                    {ticket.subject}
                                </h3>
                            </div>

                            {/* Description Preview */}
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {ticket.description}
                            </p>

                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    <span>{ticket.requesterName}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Due: {format(new Date(ticket.dueDate), 'MMM dd, yyyy')}</span>
                                </div>
                                {ticket.assignedToName && (
                                    <div className="flex items-center gap-1">
                                        <User className="w-4 h-4" />
                                        <span>Assigned to: {ticket.assignedToName}</span>
                                    </div>
                                )}
                                <div className="text-xs">
                                    {getRequestTypeLabel(ticket.requestType)}
                                </div>
                            </div>
                        </div>

                        {/* Right: Status & Priority */}
                        <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onTicketClick(ticket)
                                }}
                            >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                            </Button>
                        </div>
                    </div>

                    {/* Solutions Count */}
                    {ticket.solutions && ticket.solutions.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>{ticket.solutions.length} solution{ticket.solutions.length !== 1 ? 's' : ''} added</span>
                            </div>
                        </div>
                    )}
                </Card>
            ))}
        </div>
    )
}

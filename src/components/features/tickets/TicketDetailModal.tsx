'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { Ticket } from '@/types'
import {
    User,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    Plus
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
    ticket: Ticket | null
    open: boolean
    onClose: () => void
    onUpdate: () => void
    isAdmin?: boolean
}

export function TicketDetailModal({ ticket, open, onClose, onUpdate, isAdmin = false }: Props) {
    const { userData } = useAuth()
    const [loading, setLoading] = useState(false)
    const [solutionText, setSolutionText] = useState('')
    const [showSolutionForm, setShowSolutionForm] = useState(false)

    useEffect(() => {
        if (!open) {
            setSolutionText('')
            setShowSolutionForm(false)
        }
    }, [open])

    if (!ticket) return null

    const handleAddSolution = async () => {
        if (!solutionText.trim()) {
            toast.error('Please enter a solution')
            return
        }

        setLoading(true)
        try {
            const response = await fetch(`/api/tickets/${ticket.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'addSolution',
                    solutionText: solutionText.trim(),
                    addedByName: userData?.fullName || userData?.email || 'Unknown User'
                })
            })

            if (!response.ok) throw new Error('Failed to add solution')

            toast.success('Solution added successfully')
            setSolutionText('')
            setShowSolutionForm(false)
            onUpdate()
        } catch (error) {
            console.error('Error adding solution:', error)
            toast.error('Failed to add solution')
        } finally {
            setLoading(false)
        }
    }

    const handleResolve = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/tickets/${ticket.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'resolve',
                    resolvedByName: userData?.fullName || userData?.email || 'Unknown User'
                })
            })

            if (!response.ok) throw new Error('Failed to resolve ticket')

            toast.success('Ticket resolved successfully')
            onUpdate()
        } catch (error) {
            console.error('Error resolving ticket:', error)
            toast.error('Failed to resolve ticket')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/tickets/${ticket.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'close'
                })
            })

            if (!response.ok) throw new Error('Failed to close ticket')

            toast.success('Ticket closed successfully')
            onUpdate()
        } catch (error) {
            console.error('Error closing ticket:', error)
            toast.error('Failed to close ticket')
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const variants = {
            open: { className: 'bg-red-500 text-white', label: 'Open' },
            in_progress: { className: 'bg-yellow-500 text-white', label: 'In Progress' },
            resolved: { className: 'bg-green-500 text-white', label: 'Resolved' },
            closed: { className: 'bg-gray-500 text-white', label: 'Closed' }
        }
        const config = variants[status as keyof typeof variants] || variants.open
        return <Badge className={config.className}>{config.label}</Badge>
    }

    const getPriorityBadge = (priority: string) => {
        const colors = {
            low: 'bg-green-100 text-green-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-orange-100 text-orange-800',
            critical: 'bg-red-100 text-red-800'
        }
        return <Badge className={colors[priority as keyof typeof colors]}>{priority.toUpperCase()}</Badge>
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl">
                            {ticket.ticketNumber}
                        </DialogTitle>
                        <div className="flex gap-2">
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Subject */}
                    <div>
                        <h3 className="text-xl font-semibold">{ticket.subject}</h3>
                    </div>

                    {/* Meta Information */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Requester:</span>
                            <span className="font-medium">{ticket.requesterName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Created:</span>
                            <span className="font-medium">
                                {format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Due Date:</span>
                            <span className="font-medium">
                                {format(new Date(ticket.dueDate), 'MMM dd, yyyy')}
                            </span>
                        </div>
                        {ticket.assignedToName && (
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Assigned to:</span>
                                <span className="font-medium">{ticket.assignedToName}</span>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Description */}
                    <div>
                        <h4 className="font-semibold mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {ticket.description}
                        </p>
                    </div>

                    <Separator />

                    {/* Solutions */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">Solutions ({ticket.solutions?.length || 0}/3)</h4>
                            {(ticket.solutions?.length || 0) < 3 && ticket.status !== 'closed' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowSolutionForm(!showSolutionForm)}
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Solution
                                </Button>
                            )}
                        </div>

                        {/* Add Solution Form */}
                        {showSolutionForm && (
                            <div className="mb-4 p-4 border rounded-lg bg-muted/50">
                                <Label htmlFor="solution">Solution</Label>
                                <Textarea
                                    id="solution"
                                    value={solutionText}
                                    onChange={(e) => setSolutionText(e.target.value)}
                                    placeholder="Describe the solution..."
                                    rows={4}
                                    className="mt-2"
                                    disabled={loading}
                                />
                                <div className="flex justify-end gap-2 mt-3">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setShowSolutionForm(false)
                                            setSolutionText('')
                                        }}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleAddSolution}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                Adding...
                                            </>
                                        ) : (
                                            'Add Solution'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Solutions List */}
                        {ticket.solutions && ticket.solutions.length > 0 ? (
                            <div className="space-y-3">
                                {ticket.solutions.map((solution, index) => (
                                    <div key={solution.id} className="p-4 border rounded-lg">
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="font-semibold text-sm">Solution {index + 1}</span>
                                            <span className="text-xs text-muted-foreground">
                                                by {solution.addedByName} • {format(new Date(solution.addedAt), 'MMM dd, yyyy')}
                                            </span>
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap">{solution.solutionText}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No solutions added yet
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    {ticket.status !== 'closed' && (
                        <>
                            <Separator />
                            <div className="flex justify-end gap-3">
                                {ticket.status !== 'resolved' && (
                                    <Button
                                        onClick={handleResolve}
                                        disabled={loading || (ticket.solutions?.length || 0) === 0}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Resolving...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Mark as Resolved
                                            </>
                                        )}
                                    </Button>
                                )}
                                {isAdmin && (
                                    <Button
                                        onClick={handleClose}
                                        disabled={loading}
                                        variant="outline"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Closing...
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Close Ticket
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

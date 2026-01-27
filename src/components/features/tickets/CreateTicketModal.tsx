'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TicketRequestType, Priority } from '@/types'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Props {
    open: boolean
    onClose: () => void
    onSuccess: () => void
}

export function CreateTicketModal({ open, onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        requestType: 'general_query' as TicketRequestType,
        priority: 'medium' as Priority,
        dueDate: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    dueDate: new Date(formData.dueDate)
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create ticket')
            }

            toast.success('Ticket created successfully!')
            onSuccess()

            // Reset form
            setFormData({
                subject: '',
                description: '',
                requestType: 'general_query',
                priority: 'medium',
                dueDate: ''
            })
        } catch (error) {
            console.error('Error creating ticket:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to create ticket')
        } finally {
            setLoading(false)
        }
    }

    const getMinDate = () => {
        const today = new Date()
        return today.toISOString().split('T')[0]
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Support Ticket</DialogTitle>
                    <DialogDescription>
                        Submit a support request. Our team will respond as soon as possible.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {/* Subject */}
                    <div>
                        <Label htmlFor="subject">
                            Subject <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="subject"
                            placeholder="Brief description of your issue"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            required
                            disabled={loading}
                            className="mt-1"
                        />
                    </div>

                    {/* Request Type */}
                    <div>
                        <Label htmlFor="requestType">
                            Request Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={formData.requestType}
                            onValueChange={(value) => setFormData({ ...formData, requestType: value as TicketRequestType })}
                            disabled={loading}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general_query">❓ General Query</SelectItem>
                                <SelectItem value="office_cleaning">🧹 Office Cleaning</SelectItem>
                                <SelectItem value="stationery">📦 Stationery</SelectItem>
                                <SelectItem value="purchase_request">💰 Purchase Request</SelectItem>
                                <SelectItem value="repair_maintenance">🛠️ Repair & Maintenance</SelectItem>
                                <SelectItem value="hr_helpdesk">👥 HR Helpdesk</SelectItem>
                                <SelectItem value="it_support">💻 IT Support</SelectItem>
                                <SelectItem value="accounts_admin">📄 Accounts & Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Priority */}
                    <div>
                        <Label htmlFor="priority">
                            Priority <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={formData.priority}
                            onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}
                            disabled={loading}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">🟢 Low</SelectItem>
                                <SelectItem value="medium">🟡 Medium</SelectItem>
                                <SelectItem value="high">🔴 High</SelectItem>
                                <SelectItem value="critical">🚨 Critical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Due Date */}
                    <div>
                        <Label htmlFor="dueDate">
                            Expected Resolution Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="dueDate"
                            type="date"
                            min={getMinDate()}
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            required
                            disabled={loading}
                            className="mt-1"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <Label htmlFor="description">
                            Description <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Provide detailed information about your request..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={6}
                            required
                            disabled={loading}
                            className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Include any relevant details, error messages, or steps to reproduce the issue.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Ticket'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

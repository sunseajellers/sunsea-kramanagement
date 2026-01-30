'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { TicketRequestType, Priority } from '@/types'
import { toast } from 'sonner'
import { LifeBuoy, Loader2 } from 'lucide-react'

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
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <div className="bg-primary px-12 py-16 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
                            <LifeBuoy className="w-48 h-48" />
                        </div>
                        <DialogTitle className="text-4xl font-black tracking-tight uppercase mb-2">
                            New Request
                        </DialogTitle>
                        <p className="text-secondary text-[10px] font-black uppercase tracking-[0.4em]">Help & Support Ticket</p>
                    </div>

                    <div className="p-12 space-y-10 bg-white max-h-[75vh] overflow-y-auto scroll-panel">
                        {/* Subject */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.3em] ml-2">What's the issue? *</label>
                            <Input
                                placeholder="E.g. I need help with my login"
                                className="h-12"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            {/* Request Type */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.3em] ml-2">Category *</label>
                                <Select
                                    value={formData.requestType}
                                    onValueChange={(value) => setFormData({ ...formData, requestType: value as TicketRequestType })}
                                    disabled={loading}
                                >
                                    <SelectTrigger className="h-12 border-none bg-muted/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-3xl border-none shadow-2xl p-2">
                                        <SelectItem value="general_query" className="rounded-xl py-3">❓ Question</SelectItem>
                                        <SelectItem value="office_cleaning" className="rounded-xl py-3">🧹 Cleaning</SelectItem>
                                        <SelectItem value="stationery" className="rounded-xl py-3">📦 Supplies</SelectItem>
                                        <SelectItem value="purchase_request" className="rounded-xl py-3">💰 Purchase</SelectItem>
                                        <SelectItem value="repair_maintenance" className="rounded-xl py-3">🛠️ Repair</SelectItem>
                                        <SelectItem value="hr_helpdesk" className="rounded-xl py-3">👥 HR Help</SelectItem>
                                        <SelectItem value="it_support" className="rounded-xl py-3">💻 IT Support</SelectItem>
                                        <SelectItem value="accounts_admin" className="rounded-xl py-3">📄 Paperwork</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Priority */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.3em] ml-2">Urgency *</label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}
                                    disabled={loading}
                                >
                                    <SelectTrigger className="h-12 border-none bg-muted/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-3xl border-none shadow-2xl p-2">
                                        <SelectItem value="low" className="rounded-xl py-3">🟢 Low</SelectItem>
                                        <SelectItem value="medium" className="rounded-xl py-3">🟡 Normal</SelectItem>
                                        <SelectItem value="high" className="rounded-xl py-3">🔴 High</SelectItem>
                                        <SelectItem value="critical" className="rounded-xl py-3">🚨 Immediate</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.3em] ml-2">When do you need it by? *</label>
                            <Input
                                type="date"
                                min={getMinDate()}
                                className="h-12"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.3em] ml-2">Details *</label>
                            <Textarea
                                placeholder="Explain your request in detail..."
                                className="min-h-[160px] py-6 resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-6 pt-6">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 h-12"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="flex-1 h-12 font-bold">
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    'Submit Request'
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

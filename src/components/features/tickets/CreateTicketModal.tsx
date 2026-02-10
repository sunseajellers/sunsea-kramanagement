'use client'

import { useState, FormEvent } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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

    const handleSubmit = async (e: FormEvent) => {
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
        <Dialog open={open} onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-2xl bg-secondary/10 text-secondary shadow-sm border border-secondary/10">
                            <LifeBuoy className="w-8 h-8" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight">New Support Request</DialogTitle>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Resolution & Troubleshooting Ticket</p>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-10 py-6">
                    {/* Core Issue Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-1 bg-primary rounded-full" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">The Problem Definition</h3>
                        </div>

                        <div className="grid gap-6">
                            <div className="grid gap-2.5">
                                <Label htmlFor="subject" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Summary / Subject *</Label>
                                <Input
                                    id="subject"
                                    placeholder="E.g. I need help with my login"
                                    className="h-12 bg-slate-50/50 border-slate-100"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="grid gap-2.5">
                                    <Label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Category</Label>
                                    <Select
                                        value={formData.requestType}
                                        onValueChange={(value) => setFormData({ ...formData, requestType: value as TicketRequestType })}
                                        disabled={loading}
                                    >
                                        <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="general_query">❓ Question</SelectItem>
                                            <SelectItem value="office_cleaning">🧹 Cleaning</SelectItem>
                                            <SelectItem value="stationery">📦 Supplies</SelectItem>
                                            <SelectItem value="purchase_request">💰 Purchase</SelectItem>
                                            <SelectItem value="repair_maintenance">🛠️ Repair</SelectItem>
                                            <SelectItem value="hr_helpdesk">👥 HR Help</SelectItem>
                                            <SelectItem value="it_support">💻 IT Support</SelectItem>
                                            <SelectItem value="accounts_admin">📄 Paperwork</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2.5">
                                    <Label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Urgency Level</Label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}
                                        disabled={loading}
                                    >
                                        <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">🟢 Low Priority</SelectItem>
                                            <SelectItem value="medium">🟡 Normal</SelectItem>
                                            <SelectItem value="high">🔴 High Priority</SelectItem>
                                            <SelectItem value="critical">🚨 Critical / Immediate</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-1 bg-secondary rounded-full" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Timeline Expectations</h3>
                        </div>

                        <div className="grid gap-2.5">
                            <Label htmlFor="dueDate" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Desired Resolution Date *</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                min={getMinDate()}
                                className="h-12 bg-slate-50/50 border-slate-100"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Detailed Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-1 bg-slate-200 rounded-full" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">The Context (Required)</h3>
                        </div>

                        <div className="grid gap-2.5">
                            <Label htmlFor="description" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Full Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Explain your request in detail so we can help faster..."
                                className="min-h-[140px] py-4 resize-none bg-slate-50/50 border-slate-100"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-8 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                            className="h-12 px-8 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="h-12 px-10 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <LifeBuoy className="w-5 h-5 mr-3" />}
                            Submit Ticket
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

'use client';

import { useState, useEffect } from 'react';
import { Ticket } from '@/types';
import { createTicket, getTickets } from '@/lib/helpdeskService';
import {
    AlertCircle,
    Zap, Tag, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function TicketBoard() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // New Ticket State
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        const data = await getTickets();
        setTickets(data);
    };

    const handleCreate = async () => {
        if (!subject || !description) return;
        setSubmitting(true);
        try {
            await createTicket({
                subject,
                description,
                status: 'open',
                requesterId: 'current-user',
                requesterName: 'Current User'
            });
            toast.success('Ticket created with smart routing');
            setIsCreateOpen(false);
            setSubject('');
            setDescription('');
            loadTickets();
        } catch (error) {
            toast.error('Failed to create ticket');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-black text-slate-900 text-lg">Active Tickets</h3>
                <Button onClick={() => setIsCreateOpen(true)} className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    New Ticket
                </Button>
            </div>

            <div className="space-y-4">
                {tickets.map(ticket => (
                    <div key={ticket.id} className="glass-panel p-4 flex items-start gap-4">
                        <div className={cn(
                            "p-3 rounded-xl",
                            ticket.priority === 'critical' ? "bg-rose-100 text-rose-600" :
                                ticket.priority === 'high' ? "bg-amber-100 text-amber-600" :
                                    "bg-blue-100 text-blue-600"
                        )}>
                            <AlertCircle className="w-5 h-5" />
                        </div>

                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-slate-900">{ticket.subject}</h4>
                                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{ticket.description}</p>
                                </div>
                                <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                    {ticket.ticketNumber}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 mt-3">
                                {ticket.autoAssigned && (
                                    <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary">
                                        <Zap className="w-3 h-3" />
                                        Smart Routed to {ticket.department}
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    {ticket.tags?.map(tag => (
                                        <span key={tag} className="flex items-center text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                            <Tag className="w-2.5 h-2.5 mr-1" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {tickets.length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                        No tickets found.
                    </div>
                )}
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit Support Ticket</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Subject</label>
                            <Input
                                placeholder="e.g. Broken Payment Link"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Description</label>
                            <Textarea
                                placeholder="Describe the issue..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="h-32"
                            />
                        </div>
                        <div className="bg-indigo-50 p-3 rounded-lg flex gap-3 text-indigo-700 text-xs">
                            <Zap className="w-4 h-4 shrink-0" />
                            <p>Our <strong>Smart Router</strong> will automatically assign urgency and the correct department based on your description.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={submitting} className="btn-primary">
                            Submit Ticket
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

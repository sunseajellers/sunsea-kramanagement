'use client'

import { useState, useEffect } from 'react';
import { getAllInvoices } from '@/lib/invoiceService';
import { Invoice } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, Download, FileText, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function InvoiceList() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const data = await getAllInvoices()
            setInvoices(data)
        } catch (error) {
            toast.error('Failed to load invoices')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
            </div>
        )
    }

    return (
        <div className="glass-panel overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-border/40 bg-muted/20">
                        <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Invoice</th>
                        <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Customer</th>
                        <th className="text-center p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Status</th>
                        <th className="text-center p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Amount</th>
                        <th className="text-center p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Due Date</th>
                        <th className="w-20"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                    {invoices.map((inv) => (
                        <tr key={inv.id} className="group hover:bg-muted/30 transition-colors">
                            <td className="p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <span className="font-bold text-slate-900 text-xs">{inv.invoiceNumber}</span>
                                </div>
                            </td>
                            <td className="p-6">
                                <span className="text-sm font-medium text-slate-600">{inv.customerName}</span>
                            </td>
                            <td className="p-6 text-center">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                    inv.status === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                        inv.status === 'overdue' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                            "bg-amber-50 text-amber-600 border-amber-100"
                                )}>
                                    {inv.status}
                                </span>
                            </td>
                            <td className="p-6 text-center font-mono font-bold text-slate-900 text-xs">
                                ${inv.amount.toLocaleString()}
                            </td>
                            <td className="p-6 text-center text-xs text-muted-foreground">
                                {inv.dueDate.toLocaleDateString()}
                            </td>
                            <td className="p-6 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Download className="h-4 h-4 text-slate-400" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 h-4 text-slate-400" />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

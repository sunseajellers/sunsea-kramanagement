'use client';

import { Quote } from '@/types';
import { format } from 'date-fns';
import { FileText, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { convertQuoteToInvoice } from '@/lib/salesService';
import toast from 'react-hot-toast';

interface Props {
    quotes: Quote[];
    onRefresh: () => void;
}

export default function QuoteList({ quotes, onRefresh }: Props) {
    const handleConvert = async (id: string) => {
        try {
            await convertQuoteToInvoice(id);
            toast.success('Quote converted to Invoice');
            onRefresh();
        } catch (error) {
            toast.error('Failed to convert quote');
        }
    };

    return (
        <div className="space-y-4">
            {quotes.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No quotes generated yet</p>
                </div>
            ) : (
                quotes.map((quote) => (
                    <div key={quote.id} className="glass-panel p-4 flex items-center justify-between group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">{quote.customerName || 'Unknown Customer'}</h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                    <span className="font-mono">{quote.quoteNumber}</span>
                                    <span>•</span>
                                    <span>{format(new Date(quote.createdAt), 'MMM dd, yyyy')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="font-black text-slate-900">${quote.totalAmount.toFixed(2)}</p>
                                <span className={cn(
                                    "text-[10px] uppercase font-black px-2 py-0.5 rounded-full inline-block mt-1",
                                    quote.status === 'converted' ? "bg-emerald-100 text-emerald-600" :
                                        quote.status === 'draft' ? "bg-slate-100 text-slate-600" :
                                            "bg-amber-100 text-amber-600"
                                )}>
                                    {quote.status}
                                </span>
                            </div>

                            {quote.status !== 'converted' && (
                                <Button
                                    size="sm"
                                    onClick={() => handleConvert(quote.id)}
                                    className="bg-slate-900 text-white hover:bg-primary"
                                >
                                    Convert to Invoice
                                    <ArrowRight className="w-3 h-3 ml-2" />
                                </Button>
                            )}
                            {quote.status === 'converted' && (
                                <div className="flex items-center text-emerald-600 text-xs font-bold px-4">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Invoiced
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

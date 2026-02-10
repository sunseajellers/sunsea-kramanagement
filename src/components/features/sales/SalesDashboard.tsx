'use client';

import { useState, useEffect } from 'react';
import QuoteList from './QuoteList';
import QuoteGenerator from './QuoteGenerator';
import { getQuotes, getSalesStats } from '@/lib/salesService';
import { Quote } from '@/types';
import {
    DollarSign, TrendingUp, FileText,
    PieChart, CreditCard, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function SalesDashboard() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [q, s] = await Promise.all([
                getQuotes(),
                getSalesStats()
            ]);
            setQuotes(q);
            setStats(s);
        } catch (error) {
            console.error('Failed to load sales data');
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Loading Commercial Engine...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sales & Revenue</h1>
                    <p className="text-slate-500 font-medium mt-1">Quote-to-Cash pipeline, commission tracking, and deal analytics.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-11 px-6 border-slate-200">
                        Commission Report
                    </Button>
                    <Button
                        onClick={() => setIsGeneratorOpen(true)}
                        className="btn-primary h-11 px-6 shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Quote
                    </Button>
                </div>
            </div>

            {/* Core Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Pending Quotes', value: stats.pendingQuotes, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'Avg Deal Size', value: `$${stats.averageDealSize.toLocaleString()}`, icon: PieChart, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((stat) => (
                    <div key={stat.label} className="glass-panel p-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quote Pipeline */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1 bg-primary rounded-full" />
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Recent Quotations</h2>
                    </div>
                    <QuoteList quotes={quotes} onRefresh={loadData} />
                </div>

                {/* Commission & Targets Widget */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
                        <div className="flex items-center gap-3 mb-6">
                            <CreditCard className="w-5 h-5 text-emerald-400" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">My Commissions</h3>
                        </div>

                        <div className="space-y-1 mb-8">
                            <h2 className="text-4xl font-black text-white">$1,240.50</h2>
                            <p className="text-sm text-slate-400 font-medium">Earned this month</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                                    <span>Target Progress</span>
                                    <span>65%</span>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[65%]" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                You are on track to hit your monthly target. Close 3 more deals to unlock the accelerator bonus.
                            </p>
                        </div>
                    </div>

                    <div className="glass-panel p-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Top Performers</h3>
                        <div className="space-y-4">
                            {['Sarah Jenkins', 'Mike Ross', 'Jessica Pearson'].map((agent, i) => (
                                <div key={agent} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                            {agent.substring(0, 2)}
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">{agent}</span>
                                    </div>
                                    <span className="text-xs font-black text-emerald-600">${(15000 - i * 1200).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <QuoteGenerator
                isOpen={isGeneratorOpen}
                onClose={() => setIsGeneratorOpen(false)}
                onSuccess={loadData}
            />
        </div>
    );
}

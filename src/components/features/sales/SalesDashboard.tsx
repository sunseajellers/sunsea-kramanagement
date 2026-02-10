'use client'

import { useEffect, useState } from "react";
import SalesPipeline from './SalesPipeline';
import RevenueAnalytics from './RevenueAnalytics';
import InvoiceList from './InvoiceList';
import { BarChart3, TrendingUp, Target, Landmark, ArrowUpRight, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getAllSales } from '@/lib/salesService';
import { Sale } from '@/types';

export default function SalesDashboard() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        pipelineValue: '$0',
        wonRevenue: '$0',
        conversionRate: '0%',
        avgCycle: '0 Days'
    });

    useEffect(() => {
        const fetchSalesData = async () => {
            try {
                const allSales = await getAllSales();
                setSales(allSales);

                const pipelineValue = allSales.reduce((sum, s) => sum + (s.amount || 0), 0);
                const wonSales = allSales.filter(s => s.stage === 'closed_won');
                const wonValue = wonSales.reduce((sum, s) => sum + (s.amount || 0), 0);
                const conversion = allSales.length > 0 ? (wonSales.length / allSales.length) * 100 : 0;

                setMetrics({
                    pipelineValue: `$${pipelineValue.toLocaleString()}`,
                    wonRevenue: `$${wonValue.toLocaleString()}`,
                    conversionRate: `${Math.round(conversion)}%`,
                    avgCycle: '12 Days' // Placeholder for now
                });
            } catch (error) {
                console.error('Error fetching sales dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSalesData();
    }, []);

    const highValueDeals = [...sales]
        .sort((a, b) => (b.amount || 0) - (a.amount || 0))
        .slice(0, 3);

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sales & Revenue</h1>
                    <p className="text-slate-500 font-medium mt-1">Track your pipeline, monitor revenue trends, and optimize sales performance.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-11 px-6 border-slate-200 hover:bg-slate-50">
                        View Reports
                    </Button>
                    <Button className="btn-primary h-11 px-6 shadow-lg shadow-primary/20">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        New Opportunity
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Pipeline Value', value: metrics.pipelineValue, change: '+15%', icon: Landmark, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Won Requests', value: metrics.wonRevenue, change: '+8%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Conversion Rate', value: metrics.conversionRate, change: '-2%', icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Avg Sale Cycle', value: metrics.avgCycle, change: '+1 Day', icon: ArrowUpRight, color: 'text-primary', bg: 'bg-primary/5' },
                ].map((stat) => (
                    <div key={stat.label} className="glass-panel p-6 group hover:border-primary/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <span className={cn(
                                "text-[10px] font-black px-2 py-0.5 rounded-full border",
                                stat.change.startsWith('+') ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                            )}>
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">{stat.label}</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2">
                    <RevenueAnalytics />
                </div>

                {/* Top Opportunities */}
                <div className="glass-panel p-6 flex flex-col">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">High Value Deals</h3>
                    <div className="space-y-6 flex-1">
                        {highValueDeals.map((deal) => (
                            <div key={deal.id} className="flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate max-w-[150px]">{deal.customerName}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{deal.stage}</p>
                                    </div>
                                    <p className="text-sm font-black text-primary">${(deal.amount || 0).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${deal.probability || 0}%` }} />
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400">{deal.probability || 0}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button variant="ghost" className="w-full mt-6 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5">
                        View All Opportunities
                    </Button>
                </div>
            </div>

            {/* Sales Pipeline */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1 bg-indigo-500 rounded-full" />
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Sales Pipeline</h2>
                    </div>
                </div>
                <SalesPipeline />
            </div>

            {/* Invoices & Payments */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1 bg-emerald-500 rounded-full" />
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Invoices & Payments</h2>
                    </div>
                    <Button variant="outline" size="sm" className="h-9 px-4 text-[10px] font-black uppercase tracking-widest gap-2">
                        <CreditCard className="w-3.5 h-3.5" />
                        Process Payment
                    </Button>
                </div>
                <InvoiceList />
            </div>
        </div>
    );
}

'use client'

import { useState, useEffect } from 'react';
import CampaignManager from './CampaignManager';
import { getMarketingStats, getChannelPerformance, MarketingStats } from '@/lib/marketingService';
import { Users, Target, DollarSign, ArrowUpRight, BarChart3, Globe, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function MarketingDashboard() {
    const [stats, setStats] = useState<MarketingStats | null>(null);
    const [performance, setPerformance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [s, p] = await Promise.all([
                getMarketingStats(),
                getChannelPerformance()
            ]);
            setStats(s);
            setPerformance(p);
        } catch (error) {
            console.error('Failed to load marketing data');
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Users className="w-12 h-12 animate-pulse text-primary/40" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Analyzing Audience...</p>
            </div>
        );
    }

    const statItems = [
        { label: 'Total Reach', value: stats.totalLeads.toLocaleString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Total Spend', value: `$${stats.monthlySpend.toLocaleString()}`, icon: DollarSign, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'ROI (Global)', value: `4.2x`, icon: ArrowUpRight, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20">
                        <Target className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase tracking-tight">Marketing Automation</h1>
                        <p className="text-slate-500 font-medium mt-1">Campaign tracking, channel ROI and audience insights.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-11 px-6 border-slate-200 font-bold bg-white">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Reports
                    </Button>
                    <Button className="btn-primary h-11 px-6 shadow-lg shadow-primary/20 font-bold">
                        <Plus className="w-4 h-4 mr-2" />
                        New Campaign
                    </Button>
                </div>
            </div>

            {/* Core Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statItems.map((s) => (
                    <div key={s.label} className="glass-panel p-6 flex items-center justify-between border-none shadow-lg">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                            <h3 className="text-2xl font-black text-slate-900">{s.value}</h3>
                        </div>
                        <div className={`p-4 rounded-2xl ${s.bg} ${s.color}`}>
                            <s.icon className="w-6 h-6" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visual Analysis */}
                <Card className="lg:col-span-8 glass-panel p-8 border-none bg-slate-900 text-white relative overflow-hidden group">
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div className="p-4 rounded-3xl bg-white/10 backdrop-blur-md w-fit">
                                <Globe className="w-10 h-10 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight leading-tight">Channel Performance</h3>
                                <p className="text-slate-400 font-medium mt-3 text-sm leading-relaxed">
                                    Your multi-channel campaigns are outperforming the industry average by 22%. Organic search continues to be the highest quality lead source.
                                </p>
                            </div>
                            <Button className="bg-white text-slate-900 font-black px-8 h-12 rounded-2xl hover:bg-slate-100 transition-all border-none">
                                Deep Dive Analytics
                            </Button>
                        </div>

                        <div className="space-y-6 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Channel ROI (YoY)</h4>
                            <div className="space-y-4">
                                {performance.map((item) => (
                                    <div key={item.channel} className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span>{item.channel}</span>
                                            <span className="text-emerald-400">+{item.growth}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all duration-1000"
                                                style={{ width: `${item.roi * 10}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Campaign Feed */}
                <div className="lg:col-span-4">
                    <CampaignManager />
                </div>
            </div>
        </div>
    );
}

'use client'

import { useState, useEffect, ReactNode } from 'react';
import {
    getOperationalKPIs,
    getRevenueTrends,
    getDepartmentPerformance,
    OperationalKPIs
} from '@/lib/analyticsService';
import {
    AreaChart, Area, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
    Activity, Users, Target,
    ArrowUpRight, ArrowDownRight, Download,
    Calendar, Maximize2, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AnalyticsDashboard() {
    const [kpis, setKpis] = useState<OperationalKPIs | null>(null);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [deptPerformance, setDeptPerformance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [k, r, d] = await Promise.all([
                getOperationalKPIs(),
                getRevenueTrends(),
                getDepartmentPerformance()
            ]);
            setKpis(k);
            setRevenueData(r);
            setDeptPerformance(d);
        } catch (error) {
            console.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    if (loading || !kpis) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Activity className="w-8 h-8 animate-spin text-primary/40" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Synthesizing Business Intelligence...</p>
            </div>
        );
    }

    const coreStats = [
        { label: 'CRM Engagement', value: kpis.crm.total, trend: kpis.crm.trend, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Pipeline Value', value: `$${(kpis.sales.total / 1000).toFixed(0)}k`, trend: kpis.sales.trend, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Workforce Hub', value: kpis.staff.total, trend: kpis.staff.trend, icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Ops Completion', value: `${kpis.workflow.completion}%`, trend: kpis.workflow.trend, icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Intelligence & BI</h1>
                    <p className="text-slate-500 font-medium mt-1">Cross-module operational insights and strategic performance reporting.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-11 px-6 border-slate-200">
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                    </Button>
                    <Button className="btn-primary h-11 px-6 shadow-lg shadow-primary/20">
                        <Calendar className="w-4 h-4 mr-2" />
                        Q2 2024
                    </Button>
                </div>
            </div>

            {/* Core KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {coreStats.map((stat) => (
                    <div key={stat.label} className="glass-panel p-6 hover:shadow-2xl hover:shadow-primary/5 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className={cn(
                                "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full",
                                stat.trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                            )}>
                                {stat.trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {Math.abs(stat.trend)}%
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue & Target Chart */}
                <div className="lg:col-span-2 glass-panel p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Growth Projection</h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">Revenue Actual vs Target</p>
                        </div>
                        <TabsList className="bg-muted/30">
                            <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase tracking-widest">Yearly</Button>
                            <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase tracking-widest bg-white shadow-sm text-primary">Monthly</Button>
                        </TabsList>
                    </div>
                    <div className="w-full h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                                <Line type="monotone" dataKey="target" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Department Performance Radar */}
                <div className="glass-panel p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Dept Efficiency</h3>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                            <Maximize2 className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="w-full h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={deptPerformance}>
                                <PolarGrid stroke="#f1f5f9" />
                                <PolarAngleAxis dataKey="dept" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Efficiency"
                                    dataKey="efficiency"
                                    stroke="#6366f1"
                                    fill="#6366f1"
                                    fillOpacity={0.6}
                                />
                                <Radar
                                    name="Quality"
                                    dataKey="quality"
                                    stroke="#10b981"
                                    fill="#10b981"
                                    fillOpacity={0.6}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TabsList({ children, className }: { children: ReactNode, className?: string }) {
    return (
        <div className={cn("p-1.5 flex gap-1 rounded-2xl", className)}>
            {children}
        </div>
    )
}

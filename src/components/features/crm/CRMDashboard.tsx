'use client'

import { useEffect, useState } from 'react';
import CustomerDirectory from './CustomerDirectory';
import { TicketStatsCards } from '../tickets/TicketStatsCards';
import { Users, UserPlus, HeartHandshake, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllCustomers } from '@/lib/crmService';
import { ticketService } from '@/lib/ticketService';
import { TicketStats } from '@/types';

export default function CRMDashboard() {
    const [stats, setStats] = useState({
        totalCustomers: '0',
        activeLeads: '0',
        retentionRate: '0%',
        openTickets: '0'
    });
    const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [customers, tStats] = await Promise.all([
                    getAllCustomers(),
                    ticketService.getTicketStats()
                ]);

                const activeLeads = customers.filter(c => c.status === 'active').length;
                const total = customers.length;
                const retention = total > 0 ? Math.round((activeLeads / total) * 100) : 0;

                setStats({
                    totalCustomers: total.toLocaleString(),
                    activeLeads: activeLeads.toLocaleString(),
                    retentionRate: `${retention}%`,
                    openTickets: tStats.open.toString()
                });
                setTicketStats(tStats);
            } catch (error) {
                console.error('Error fetching CRM dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

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
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">CRM & Customer Management</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage relationships, track engagement, and resolve support requests.</p>
                </div>
                <Button className="btn-primary h-11 px-6 shadow-lg shadow-primary/20">
                    <UserPlus className="w-4 h-4 mr-2" />
                    New Customer
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Active Leads', value: stats.activeLeads, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/5' },
                    { label: 'Retention Rate', value: stats.retentionRate, icon: HeartHandshake, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Open Tickets', value: stats.openTickets, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
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

            {/* Main Tabs/Sections */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Customer Directory</h2>
                </div>
                <CustomerDirectory />
            </div>

            {/* Support Integration */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-amber-500 rounded-full" />
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Support Overview</h2>
                </div>
                {ticketStats && <TicketStatsCards stats={ticketStats} />}
            </div>
        </div>
    );
}

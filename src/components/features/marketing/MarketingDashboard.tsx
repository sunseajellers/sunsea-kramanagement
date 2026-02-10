'use client';

import { useState, useEffect } from 'react';
import CampaignBoard from './CampaignBoard';
import { getCampaigns, getMarketingStats, createCampaign } from '@/lib/marketingService';
import { Campaign, CampaignType } from '@/types';
import {
    Megaphone, Target, Mail,
    MousePointer, Users, Filter, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function MarketingDashboard() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Create Form State
    const [newCampaignName, setNewCampaignName] = useState('');
    const [newCampaignType, setNewCampaignType] = useState<CampaignType>('email');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [c, s] = await Promise.all([
                getCampaigns(),
                getMarketingStats()
            ]);
            setCampaigns(c);
            setStats(s);
        } catch (error) {
            console.error('Failed to load marketing data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newCampaignName) {
            toast.error('Please enter a campaign name');
            return;
        }

        setCreating(true);
        try {
            await createCampaign({
                name: newCampaignName,
                type: newCampaignType,
                budget: 1000, // Default budget for demo
                createdBy: 'current-user',
            } as any);

            toast.success('Campaign created');
            setIsCreateOpen(false);
            setNewCampaignName('');
            loadData();
        } catch (error) {
            toast.error('Failed to create campaign');
        } finally {
            setCreating(false);
        }
    };

    if (loading || !stats) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Megaphone className="w-8 h-8 animate-spin text-primary/40" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Loading Marketing Engine...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Marketing Automation</h1>
                    <p className="text-slate-500 font-medium mt-1">Plan campaigns, track engagement, and nurture leads.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-11 px-6 border-slate-200">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter View
                    </Button>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="btn-primary h-11 px-6 shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Campaign
                    </Button>
                </div>
            </div>

            {/* Core Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Leads', value: stats.totalLeads.toLocaleString(), icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'Avg Open Rate', value: `${stats.emailOpenRate}%`, icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Click Rate', value: '4.2%', icon: MousePointer, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Active Campaigns', value: stats.activeCampaigns, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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

            {/* Kanban Board */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1 bg-primary rounded-full" />
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Campaign Pipeline</h2>
                    </div>
                </div>
                <CampaignBoard campaigns={campaigns} onRefresh={loadData} />
            </div>

            {/* Create Campaign Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Campaign</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Campaign Name</label>
                            <Input
                                placeholder="Summer Sale 2024"
                                value={newCampaignName}
                                onChange={(e) => setNewCampaignName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Channel</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['email', 'social', 'web', 'sms'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setNewCampaignType(type as CampaignType)}
                                        className={cn(
                                            "p-3 rounded-lg border text-sm font-bold capitalize transition-all",
                                            newCampaignType === type
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-slate-100 hover:border-slate-300 text-slate-500"
                                        )}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={creating} className="btn-primary">
                            {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create Campaign
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

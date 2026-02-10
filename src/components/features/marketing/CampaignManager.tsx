'use client'

import { useState, useEffect } from 'react';
import { Campaign } from '@/types';
import { getCampaigns } from '@/lib/marketingService';
import { Button } from '@/components/ui/button';
import {
    Plus, Search, Filter, MoreVertical,
    Mail, Share2, Target, MessageSquare,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CampaignManager() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = async () => {
        try {
            setLoading(true);
            const data = await getCampaigns();
            setCampaigns(data);
        } catch (error) {
            toast.error('Failed to load campaigns');
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type: Campaign['type']) => {
        switch (type) {
            case 'email': return Mail;
            case 'social': return Share2;
            case 'ads': return Target;
            case 'sms': return MessageSquare;
            default: return Target;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass-panel p-4">
                <div className="relative flex-1 w-full text-slate-400">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
                    <input
                        type="text"
                        placeholder="Search campaigns..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="h-10 text-[10px] font-black uppercase tracking-widest gap-2">
                        <Filter className="w-3.5 h-3.5" />
                        Type
                    </Button>
                    <Button className="btn-primary h-10 px-6 text-[10px] font-black uppercase tracking-widest gap-2">
                        <Plus className="w-3.5 h-3.5" />
                        New Campaign
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((camp) => {
                    const Icon = getTypeIcon(camp.type);
                    return (
                        <div key={camp.id} className="glass-panel p-6 group hover:border-primary/50 transition-all relative overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <div className={cn(
                                    "p-3 rounded-2xl",
                                    camp.type === 'email' ? "bg-blue-50 text-blue-600" :
                                        camp.type === 'ads' ? "bg-amber-50 text-amber-600" :
                                            "bg-purple-50 text-purple-600"
                                )}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                    camp.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                        camp.status === 'paused' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                            "bg-slate-50 text-slate-400 border-slate-100"
                                )}>
                                    {camp.status}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-black text-slate-900 tracking-tight">{camp.name}</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Started {camp.startDate?.toLocaleDateString() || 'Pending'}</p>
                                </div>

                                <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-50">
                                    <div className="text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Leads</p>
                                        <p className="text-sm font-black text-slate-900">{camp.leads || 0}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Conv.</p>
                                        <p className="text-sm font-black text-slate-900">{camp.conversions || 0}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ROI</p>
                                        <p className="text-sm font-black text-emerald-600">{(camp.roi || 0).toFixed(1)}x</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-slate-400">Budget $USD</span>
                                        <span className="text-slate-900">${camp.spend || 0} / ${camp.budget}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${((camp.spend || 0) / camp.budget) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <Button variant="outline" className="flex-1 h-9 text-[9px] font-black uppercase tracking-widest">
                                        Manage
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-9 w-9">
                                        <MoreVertical className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

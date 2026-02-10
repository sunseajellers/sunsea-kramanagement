'use client';

import { useState, useEffect } from 'react';
import OKRTree from './OKRTree';
import KeyResultUpdate from './KeyResultUpdate';
import { getObjectives, createObjective, createKeyResult } from '@/lib/okrService';
import { Objective, KeyResult } from '@/types';
import {
    Target, Trophy, TrendingUp, Calendar,
    Plus, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';

export default function OKRDashboard() {
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [loading, setLoading] = useState(true);

    // Check-in State
    const [selectedKR, setSelectedKR] = useState<KeyResult | null>(null);
    const [isUpdateOpen, setIsUpdateOpen] = useState(false);

    // Create State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getObjectives({ timeframe: 'quarterly' });
            setObjectives(data);
        } catch (error) {
            console.error('Failed to load OKRs');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyResultClick = (kr: KeyResult) => {
        setSelectedKR(kr);
        setIsUpdateOpen(true);
    };

    const handleCreateObjective = async () => {
        if (!newTitle) return;
        setCreating(true);
        try {
            const objId = await createObjective({
                title: newTitle,
                description: '',
                ownerId: 'current-user',
                ownerName: 'Current User',
                timeframe: 'quarterly',
                startDate: new Date(),
                endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
                year: new Date().getFullYear(),
                status: 'active'
            } as any);

            // Add dummy KR for demo
            await createKeyResult({
                objectiveId: objId,
                title: 'Achieve 100% completion on demo task',
                type: 'percentage',
                startValue: 0,
                targetValue: 100,
                ownerId: 'current-user'
            } as any);

            toast.success('Objective Created');
            setIsCreateOpen(false);
            setNewTitle('');
            loadData();
        } catch (error) {
            toast.error('Failed to create objective');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Target className="w-8 h-8 animate-spin text-primary/40" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Loading Strategic Map...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Strategy & Goals (OKR)</h1>
                    <p className="text-slate-500 font-medium mt-1">Align teams, visualize progress, and drive results.</p>
                </div>
                <div className="flex gap-3">
                    <Select defaultValue="q1-2024">
                        <SelectTrigger className="w-[180px] h-11 bg-white border-slate-200">
                            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="q1-2024">Q1 2024 (Jan-Mar)</SelectItem>
                            <SelectItem value="q2-2024">Q2 2024 (Apr-Jun)</SelectItem>
                            <SelectItem value="annual-2024">Annual 2024</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="btn-primary h-11 px-6 shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Objective
                    </Button>
                </div>
            </div>

            {/* Core Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Overall Progress', value: '68%', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Objectives On Track', value: '12', icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Key Results Completed', value: '45', icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
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

            {/* OKR Visual Tree */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1 bg-primary rounded-full" />
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Strategic Map</h2>
                    </div>
                    <OKRTree objectives={objectives} onKeyResultClick={handleKeyResultClick} />
                </div>

                <div className="space-y-6">
                    <div className="glass-panel p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
                        <Trophy className="w-8 h-8 text-amber-400 mb-4" />
                        <h3 className="font-black text-lg mb-2">Focus Area</h3>
                        <p className="text-xs text-slate-300 leading-relaxed opacity-80 mb-4">
                            "Expand market share in APAC region" is falling behind schedule. Prioritize sales enablement tasks this week.
                        </p>
                        <div className="w-full bg-white/10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white hover:bg-white/20 transition-colors cursor-pointer">
                            View Details
                        </div>
                    </div>
                </div>
            </div>

            <KeyResultUpdate
                isOpen={isUpdateOpen}
                onClose={() => setIsUpdateOpen(false)}
                keyResult={selectedKR}
                onSuccess={loadData}
            />

            {/* Create Objective Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Set New Objective</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Objective Title</label>
                            <Input
                                placeholder="e.g. Increase Customer Retention by 15%"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                            />
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg text-amber-700 text-xs flex gap-2">
                            <Trophy className="w-4 h-4 shrink-0" />
                            <p>Objectives should be ambitious, qualitative, and time-bound. Key Results will measure progress towards this objective.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateObjective} disabled={creating} className="btn-primary">
                            {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create Objective
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

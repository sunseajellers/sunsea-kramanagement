'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, Clock, User, Box, Search, RefreshCw, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ActivityLogEntry {
    id: string;
    userId: string;
    userName: string;
    action: string;
    module: string;
    resourceId: string;
    resourceName: string;
    details?: string;
    timestamp: Date;
}

export default function SimpleActivityLog() {
    const { user, isAdmin } = useAuth();
    const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchLogs = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/activity-log?limit=100&days=30', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setLogs(data.logs.map((log: any) => ({
                    ...log,
                    timestamp: new Date(log.timestamp)
                })));
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [user]);

    const filteredLogs = logs.filter(log =>
        log.userName.toLowerCase().includes(search.toLowerCase()) ||
        log.resourceName.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.details?.toLowerCase().includes(search.toLowerCase())
    );

    const getActionColor = (action: string) => {
        if (action.includes('created')) return 'text-emerald-500 bg-emerald-500/10';
        if (action.includes('completed')) return 'text-blue-500 bg-blue-500/10';
        if (action.includes('deleted') || action.includes('revision')) return 'text-rose-500 bg-rose-500/10';
        if (action.includes('status')) return 'text-amber-500 bg-amber-500/10';
        return 'text-slate-500 bg-slate-500/10';
    };

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    if (!isAdmin && !loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <p className="text-slate-500">You don't have permission to view global activity.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Activity Stream</h1>
                    <p className="text-slate-500 font-medium">Monitoring the pulse of JewelMatrix in real-time.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <Input
                            placeholder="Filter stream..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 h-11 w-64 bg-slate-50 border-none shadow-none text-sm font-medium focus-visible:ring-2 focus-visible:ring-indigo-500/20 transition-all"
                        />
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setIsRefreshing(true); fetchLogs(); }}
                        disabled={isRefreshing}
                        className="h-11 w-11 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all"
                    >
                        <RefreshCw className={cn("w-4 h-4 text-slate-600", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Stream */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <div className="w-12 h-12 bg-slate-100 rounded-full mb-4" />
                        <div className="h-4 w-32 bg-slate-100 rounded" />
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                        <p className="text-slate-400 font-medium">No activity matching your search.</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[21px] top-4 bottom-4 w-0.5 bg-slate-100" />

                        <div className="space-y-8">
                            {filteredLogs.map((log) => (
                                <div key={log.id} className="relative pl-12 group">
                                    {/* Timeline Dot */}
                                    <div className="absolute left-0 top-1.5 w-11 h-11 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center z-10 group-hover:border-indigo-200 transition-colors">
                                        <Activity className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    </div>

                                    <div className="bg-white p-5 rounded-3xl border border-slate-100 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100/50 transition-all duration-300">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">{log.userName}</span>
                                                <ChevronRight className="w-3 h-3 text-slate-300" />
                                                <span className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full", getActionColor(log.action))}>
                                                    {formatAction(log.action)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="text-xs font-semibold">
                                                    {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <Box className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                <p className="text-sm font-bold leading-relaxed">
                                                    {log.resourceName}
                                                </p>
                                            </div>
                                            {log.details && (
                                                <p className="text-xs font-medium text-slate-400 pl-6 border-l-2 border-slate-50 ml-2">
                                                    {log.details}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-300">
                                            <span>Module: <span className="text-slate-500">{log.module}</span></span>
                                            <span>Ref: <span className="text-slate-500">{log.id.slice(0, 8)}</span></span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


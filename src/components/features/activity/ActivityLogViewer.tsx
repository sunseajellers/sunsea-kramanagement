'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, Filter, Download, Search, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActivityLogEntry {
    id: string;
    userId: string;
    userName: string;
    action: string;
    module: string;
    resourceId: string;
    resourceName: string;
    changes?: Record<string, { old: any; new: any }>;
    details?: string;
    timestamp: Date | string;
}

interface ActivityLogViewerProps {
    limit?: number;
    showFilters?: boolean;
    maxHeight?: string;
    compact?: boolean;
    module?: string; // Filter by module
}

const actionColors: Record<string, string> = {
    'task_created': 'bg-blue-50 text-blue-700 border-blue-200',
    'task_updated': 'bg-purple-50 text-purple-700 border-purple-200',
    'task_completed': 'bg-green-50 text-green-700 border-green-200',
    'task_status_updated': 'bg-orange-50 text-orange-700 border-orange-200',
    'task_deleted': 'bg-red-50 text-red-700 border-red-200',
    'task_revision_requested': 'bg-pink-50 text-pink-700 border-pink-200',
    'kra_created': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'kra_status_updated': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'kra_progress_updated': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'user_login': 'bg-green-50 text-green-700 border-green-200',
    'user_logout': 'bg-gray-50 text-gray-700 border-gray-200',
    'user_role_changed': 'bg-amber-50 text-amber-700 border-amber-200',
    'team_member_added': 'bg-teal-50 text-teal-700 border-teal-200',
    'team_member_removed': 'bg-red-50 text-red-700 border-red-200',
};

const actionIcons: Record<string, string> = {
    'task_created': '➕',
    'task_updated': '✏️',
    'task_completed': '✅',
    'task_status_updated': '🔄',
    'task_deleted': '🗑️',
    'task_revision_requested': '🔁',
    'kra_created': '⭐',
    'kra_status_updated': '📊',
    'kra_progress_updated': '📈',
    'user_login': '🔓',
    'user_logout': '🔐',
    'user_role_changed': '👤',
    'team_member_added': '👥',
    'team_member_removed': '🚫',
};

const moduleColors: Record<string, string> = {
    'tasks': 'bg-blue-100 text-blue-800',
    'kras': 'bg-indigo-100 text-indigo-800',
    'users': 'bg-purple-100 text-purple-800',
    'teams': 'bg-teal-100 text-teal-800',
    'settings': 'bg-gray-100 text-gray-800',
};

export default function ActivityLogViewer({
    limit = 30,
    showFilters = true,
    maxHeight = 'max-h-96',
    compact = false,
    module: initialModule
}: ActivityLogViewerProps) {
    const { user } = useAuth();
    const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Filters
    const [module, setModule] = useState(initialModule || '');
    const [days, setDays] = useState(7);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchActivityLogs();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchActivityLogs, 30000);
        return () => clearInterval(interval);
    }, [module, days, user]);

    const fetchActivityLogs = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const params = new URLSearchParams({
                limit: limit.toString(),
                days: days.toString(),
                t: Date.now().toString(), // Cache busting
                ...(module && { module })
            });

            const response = await fetch(`/api/activity-log?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch activity logs');
            }

            const logsWithDates = data.logs.map((log: any) => ({
                ...log,
                timestamp: new Date(log.timestamp)
            }));
            setLogs(logsWithDates);
            setError(null);
        } catch (err) {
            console.error('Error fetching activity logs:', err);
            setError(err instanceof Error ? err.message : 'Failed to load activity logs');
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            log.resourceName.toLowerCase().includes(searchLower) ||
            log.userName.toLowerCase().includes(searchLower) ||
            log.details?.toLowerCase().includes(searchLower) ||
            log.action.toLowerCase().includes(searchLower)
        );
    });

    const handleExport = () => {
        const csv = [
            ['Timestamp', 'User', 'Action', 'Module', 'Resource', 'Details'],
            ...filteredLogs.map(log => [
                format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
                log.userName,
                log.action,
                log.module,
                log.resourceName,
                log.details || ''
            ])
        ]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    return (
        <div className="space-y-8 animate-in">
            {/* Context Header (if not compact) */}
            {!compact && showFilters && (
                <div className="page-header flex items-center justify-between">
                    <div>
                        <h2 className="section-title">Audit Ledger</h2>
                        <p className="section-subtitle">Comprehensive system-wide event tracking and security monitoring</p>
                    </div>
                </div>
            )}

            {/* Global Filters Panel */}
            {showFilters && (
                <div className="glass-panel p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-50 rounded-xl">
                                <Filter className="w-5 h-5 text-indigo-600" />
                            </div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Operational Filters</h3>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={handleExport}
                            className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download Audit
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Search Intelligence */}
                        <div className="md:col-span-5 space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Search Registry</label>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Keywords, IDs, Personnel..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="form-input pl-11 h-12"
                                />
                            </div>
                        </div>

                        {/* Module Vector */}
                        <div className="md:col-span-4 space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sector Analysis</label>
                            <select
                                value={module}
                                onChange={(e) => setModule(e.target.value)}
                                className="form-input h-12 appearance-none"
                            >
                                <option value="">All Sectors</option>
                                <option value="tasks">Mission Operations</option>
                                <option value="kras">Strategic Objectives</option>
                                <option value="users">Personnel Management</option>
                                <option value="teams">Unit Structures</option>
                                <option value="settings">Core Configurations</option>
                            </select>
                        </div>

                        {/* Time Vector */}
                        <div className="md:col-span-3 space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Temporal Range</label>
                            <select
                                value={days}
                                onChange={(e) => setDays(parseInt(e.target.value))}
                                className="form-input h-12 appearance-none"
                            >
                                <option value="1">Past 24 Cycles</option>
                                <option value="7">Standard Week</option>
                                <option value="30">Monthly Horizon</option>
                                <option value="90">Quarterly Audit</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Log Stream */}
            <div className="glass-panel p-0 overflow-hidden flex flex-col min-h-[400px]">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Live Data Stream</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                            {filteredLogs.length} LOGS RETRIEVED
                        </span>
                        {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
                    </div>
                </div>

                {error && (
                    <div className="px-8 py-4 bg-rose-50 border-b border-rose-100 text-rose-600 text-[11px] font-black uppercase tracking-widest">
                        Critical Error: {error}
                    </div>
                )}

                <div className={`${maxHeight} scroll-panel`}>
                    {filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center border border-slate-100 mb-6">
                                <Activity className="w-10 h-10 text-slate-200" />
                            </div>
                            <p className="text-lg font-black text-slate-400 uppercase tracking-tight">Zero Activity Records</p>
                            <p className="text-sm text-slate-400 font-medium">Verify filter parameters or audit connectivity status</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {filteredLogs.map((log) => {
                                const isExpanded = expandedId === log.id;
                                const timestamp = new Date(log.timestamp);
                                const actionColor = actionColors[log.action] || 'bg-slate-50 text-slate-700 border-slate-200';
                                const moduleColor = moduleColors[log.module] || 'bg-slate-100 text-slate-800';
                                const icon = actionIcons[log.action] || '📝';

                                return (
                                    <div key={log.id} className={cn(
                                        "group transition-all duration-300",
                                        isExpanded ? "bg-slate-50/80" : "hover:bg-slate-50/50"
                                    )}>
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                            className="w-full px-8 py-6 text-left focus:outline-none"
                                        >
                                            <div className="flex items-start gap-6">
                                                {/* Action Identity */}
                                                <div className="text-3xl flex-shrink-0 p-4 rounded-2xl bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                                    {icon}
                                                </div>

                                                {/* Core Information */}
                                                <div className="flex-1 min-w-0 pt-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={cn(
                                                            "inline-flex px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border transition-colors",
                                                            actionColor
                                                        )}>
                                                            {log.action.replace(/_/g, ' ')}
                                                        </span>
                                                        <span className={cn(
                                                            "inline-flex px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-colors",
                                                            moduleColor
                                                        )}>
                                                            {log.module}
                                                        </span>
                                                    </div>

                                                    <h4 className="text-base font-black text-slate-900 uppercase tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">
                                                        {log.resourceName}
                                                    </h4>

                                                    <div className="flex items-center gap-6 flex-wrap">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300">
                                                                <span className="text-[8px] font-black text-slate-600">{log.userName.charAt(0)}</span>
                                                            </div>
                                                            <span className="text-[11px] font-bold text-slate-600">{log.userName}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <Activity className="w-3.5 h-3.5" />
                                                            <span className="text-[11px] font-medium">{formatDistanceToNow(timestamp, { addSuffix: true })}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Dynamic Details Toggle */}
                                                {(log.details || (log.changes && Object.keys(log.changes).length > 0)) && (
                                                    <div className={cn(
                                                        "p-2 rounded-xl transition-all",
                                                        isExpanded ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                                    )}>
                                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </div>
                                                )}
                                            </div>
                                        </button>

                                        {/* Detailed Audit Context */}
                                        {isExpanded && (
                                            <div className="px-8 pb-8 pt-2 animate-in slide-in-from-top-4 duration-300">
                                                <div className="ml-24 space-y-6">
                                                    {log.details && (
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Event Summary</label>
                                                            <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm text-sm font-medium text-slate-700 leading-relaxed italic">
                                                                "{log.details}"
                                                            </div>
                                                        </div>
                                                    )}

                                                    {log.changes && Object.keys(log.changes).length > 0 && (
                                                        <div className="space-y-4">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Attribute Mutations</label>
                                                            <div className="grid grid-cols-1 gap-4">
                                                                {Object.entries(log.changes).map(([key, value]) => (
                                                                    <div key={key} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col gap-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{key}</span>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-6 pl-3">
                                                                            <div className="space-y-1">
                                                                                <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none">Original</span>
                                                                                <p className="text-[11px] font-black text-slate-500 bg-rose-50/30 p-2 rounded-lg line-through truncate opacity-60">
                                                                                    {String(value.old)}
                                                                                </p>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">Modified</span>
                                                                                <p className="text-[11px] font-black text-emerald-600 bg-emerald-50/30 p-2 rounded-lg truncate">
                                                                                    {String(value.new)}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                            Unique Audit Reference: <span className="text-slate-900">{log.id}</span>
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                            {format(timestamp, 'EEEE, MMM d, yyyy · HH:mm:ss')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

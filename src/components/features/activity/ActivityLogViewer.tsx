'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, Search, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

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
    'task_created': 'text-blue-600 bg-blue-50',
    'task_updated': 'text-purple-600 bg-purple-50',
    'task_completed': 'text-emerald-600 bg-emerald-50',
    'task_status_updated': 'text-orange-600 bg-orange-50',
    'task_deleted': 'text-red-600 bg-red-50',
    'task_revision_requested': 'text-pink-600 bg-pink-50',
    'kra_created': 'text-indigo-600 bg-indigo-50',
    'user_login': 'text-emerald-600 bg-emerald-50',
    'user_logout': 'text-slate-600 bg-slate-50',
};

const actionIcons: Record<string, string> = {
    'task_created': '➕',
    'task_completed': '✅',
    'task_deleted': '🗑️',
    'user_login': '👋',
    'user_logout': '👋',
};

const formatActionName = (action: string) => {
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function ActivityLogViewer({
    limit = 100,
    showFilters = true,
    maxHeight = 'max-h-[600px]',
    // compact = false,
    module: initialModule
}: ActivityLogViewerProps) {
    const { user } = useAuth();
    const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Filters
    const [module, setModule] = useState(initialModule || 'all');
    const [days, setDays] = useState('7');
    const [search, setSearch] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchActivityLogs();
        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchActivityLogs, 60000);
        return () => clearInterval(interval);
    }, [module, days, user]);

    const fetchActivityLogs = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const params = new URLSearchParams({
                limit: limit.toString(),
                days: days,
                t: Date.now().toString(), // Cache busting
                ...(module !== 'all' && { module })
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
            setIsRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchActivityLogs();
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

    return (
        <div className="space-y-4">
            {/* Simple Toolbar */}
            {showFilters && (
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search logs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Select value={module} onValueChange={setModule}>
                            <SelectTrigger className="w-[140px] bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Module" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Modules</SelectItem>
                                <SelectItem value="tasks">Tasks</SelectItem>
                                <SelectItem value="kras">KRAs</SelectItem>
                                <SelectItem value="users">Users</SelectItem>
                                <SelectItem value="teams">Teams</SelectItem>
                                <SelectItem value="settings">Settings</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={days} onValueChange={setDays}>
                            <SelectTrigger className="w-[140px] bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Last 24 Hours</SelectItem>
                                <SelectItem value="7">Last 7 Days</SelectItem>
                                <SelectItem value="30">Last 30 Days</SelectItem>
                                <SelectItem value="90">Last 90 Days</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRefresh}
                            disabled={isRefreshing || loading}
                            className="text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
                        >
                            <RefreshCw className={cn("w-4 h-4", (isRefreshing || loading) && "animate-spin")} />
                        </Button>
                    </div>
                </div>
            )}

            {/* Log List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                {loading && logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                        <p className="text-sm text-slate-400">Loading activity...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <p className="text-sm font-medium text-rose-600 mb-2">Unavailable</p>
                        <p className="text-xs text-slate-500">{error}</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                            <Activity className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-900">No activity found</p>
                        <p className="text-xs text-slate-500">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className={cn("divide-y divide-slate-100 overflow-y-auto", maxHeight)}>
                        {filteredLogs.map((log) => {
                            const isExpanded = expandedId === log.id;
                            const timestamp = new Date(log.timestamp);
                            const actionStyle = actionColors[log.action] || 'text-slate-600 bg-slate-100';
                            const icon = actionIcons[log.action] || '📝';

                            return (
                                <div key={log.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <div
                                        className="px-6 py-4 flex items-start gap-4 cursor-pointer"
                                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                    >
                                        <div className="flex-shrink-0 mt-1 text-lg opacity-80 select-none">
                                            {icon}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="text-sm font-semibold text-slate-900">
                                                    {log.userName}
                                                </span>
                                                <span className="text-xs text-slate-400 mx-1">•</span>
                                                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md", actionStyle)}>
                                                    {formatActionName(log.action)}
                                                </span>
                                                <span className="text-xs text-slate-400 mx-1">•</span>
                                                <span className="text-xs font-medium text-slate-500">
                                                    {formatDistanceToNow(timestamp, { addSuffix: true })}
                                                </span>
                                            </div>

                                            <p className="text-sm text-slate-600 mb-1">
                                                <span className="font-medium text-slate-800">{log.resourceName}</span>
                                            </p>

                                            {(log.details || (log.changes && Object.keys(log.changes).length > 0)) && (
                                                <div className="flex items-center gap-1 text-xs font-medium text-indigo-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {isExpanded ? 'Hide details' : 'Show details'}
                                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="px-6 pb-6 pl-16 animate-in slide-in-from-top-2 duration-200">
                                            <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-100 space-y-4">
                                                {log.details && (
                                                    <div>
                                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Details</h4>
                                                        <p className="text-sm text-slate-700">{log.details}</p>
                                                    </div>
                                                )}

                                                {log.changes && Object.keys(log.changes).length > 0 && (
                                                    <div>
                                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Changes</h4>
                                                        <div className="space-y-3">
                                                            {Object.entries(log.changes).map(([key, value]) => (
                                                                <div key={key} className="text-xs grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 bg-white rounded border border-slate-100">
                                                                    <div className="font-medium text-slate-700 self-center">{key}</div>
                                                                    <div className="text-rose-600 break-all bg-rose-50 px-2 py-1 rounded">
                                                                        <span className="opacity-50 line-through mr-2">Old:</span>
                                                                        {String(value.old)}
                                                                    </div>
                                                                    <div className="text-emerald-600 break-all bg-emerald-50 px-2 py-1 rounded">
                                                                        <span className="opacity-50 mr-2">New:</span>
                                                                        {String(value.new)}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="pt-2 flex justify-between items-center text-[10px] text-slate-400">
                                                    <span>Ref: {log.id}</span>
                                                    <span>{format(timestamp, 'PPP p')}</span>
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
    );
}

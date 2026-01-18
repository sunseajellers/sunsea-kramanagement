'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, Filter, Download, Search, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

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
        <div className="space-y-4">
            {/* Filters */}
            {showFilters && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-600" />
                        <h3 className="font-bold text-slate-800">Filters</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                                Search
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Resource, user, action..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Module Filter */}
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                                Module
                            </label>
                            <select
                                value={module}
                                onChange={(e) => setModule(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">All Modules</option>
                                <option value="tasks">Tasks</option>
                                <option value="kras">KRAs</option>
                                <option value="users">Users</option>
                                <option value="teams">Teams</option>
                                <option value="settings">Settings</option>
                            </select>
                        </div>

                        {/* Days Filter */}
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                                Time Period
                            </label>
                            <select
                                value={days}
                                onChange={(e) => setDays(parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="1">Last 24 Hours</option>
                                <option value="7">Last 7 Days</option>
                                <option value="30">Last 30 Days</option>
                                <option value="90">Last 90 Days</option>
                            </select>
                        </div>

                        {/* Export */}
                        <div className="flex items-end">
                            <button
                                onClick={handleExport}
                                className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Logs */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-slate-800">Activity Log</h3>
                        <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
                            {filteredLogs.length} ENTRIES
                        </span>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-sm font-medium">
                        {error}
                    </div>
                )}

                <div className={`${maxHeight} overflow-y-auto`}>
                    {filteredLogs.length === 0 ? (
                        <div className="p-12 text-center">
                            <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-600 font-medium">No activity logs found</p>
                            <p className="text-slate-400 text-sm">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredLogs.map((log) => {
                                const isExpanded = expandedId === log.id;
                                const timestamp = new Date(log.timestamp);
                                const actionColor = actionColors[log.action] || 'bg-slate-50 text-slate-700 border-slate-200';
                                const moduleColor = moduleColors[log.module] || 'bg-slate-100 text-slate-800';
                                const icon = actionIcons[log.action] || '📝';

                                return (
                                    <div key={log.id} className="transition-colors hover:bg-slate-50">
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                            className="w-full px-4 py-3 text-left focus:outline-none transition-colors"
                                        >
                                            <div className={`flex items-start gap-3 ${compact ? 'flex-col' : ''}`}>
                                                {/* Icon */}
                                                <div className="text-2xl flex-shrink-0">{icon}</div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-black uppercase border ${actionColor}`}>
                                                            {log.action.replace(/_/g, ' ')}
                                                        </span>
                                                        <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-black uppercase ${moduleColor}`}>
                                                            {log.module}
                                                        </span>
                                                    </div>

                                                    <p className="text-sm font-bold text-slate-900 truncate">
                                                        {log.resourceName}
                                                    </p>

                                                    <div className={`text-xs text-slate-600 mt-1 ${compact ? 'flex flex-col gap-1' : 'flex items-center gap-4'}`}>
                                                        <span>👤 {log.userName}</span>
                                                        <span>📅 {formatDistanceToNow(timestamp, { addSuffix: true })}</span>
                                                    </div>

                                                    {log.details && !compact && (
                                                        <p className="text-xs text-slate-600 mt-2 line-clamp-1">
                                                            {log.details}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Expand Icon */}
                                                {(log.details || log.changes) && (
                                                    <div className="flex-shrink-0 text-slate-400 mt-1">
                                                        {isExpanded ? (
                                                            <ChevronUp className="w-5 h-5" />
                                                        ) : (
                                                            <ChevronDown className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </button>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 bg-slate-50 border-t border-slate-200">
                                                <div className="space-y-3">
                                                    {/* Details */}
                                                    {log.details && (
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-600 uppercase mb-1">Details</p>
                                                            <p className="text-sm text-slate-800 bg-white p-2 rounded border border-slate-200">
                                                                {log.details}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Changes */}
                                                    {log.changes && Object.keys(log.changes).length > 0 && (
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-600 uppercase mb-1">Changes</p>
                                                            <div className="space-y-2">
                                                                {Object.entries(log.changes).map(([key, value]) => (
                                                                    <div key={key} className="bg-white p-2 rounded border border-slate-200 text-xs">
                                                                        <p className="font-bold text-slate-700 mb-1">{key}</p>
                                                                        <div className="flex gap-2">
                                                                            <div className="flex-1">
                                                                                <span className="text-slate-600">Old: </span>
                                                                                <span className="text-red-600 line-through">
                                                                                    {JSON.stringify(value.old)}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <span className="text-slate-600">New: </span>
                                                                                <span className="text-green-600 font-bold">
                                                                                    {JSON.stringify(value.new)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Timestamp */}
                                                    <div className="pt-2 border-t border-slate-200">
                                                        <p className="text-xs text-slate-500">
                                                            {format(timestamp, 'EEEE, MMMM d, yyyy - h:mm:ss a')}
                                                        </p>
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

'use client'

import { useState, useEffect } from 'react';
import { AuditEvent, getAuditLogs } from '@/lib/securityService';
import {
    Search,
    Filter,
    MoreHorizontal, Download,
    AlertCircle, CheckCircle2, Info, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AuditLog() {
    const [logs, setLogs] = useState<AuditEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const data = await getAuditLogs();
            setLogs(data);
        } catch (error) {
            console.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const getSeverityStyles = (severity: AuditEvent['severity']) => {
        switch (severity) {
            case 'critical': return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', icon: AlertCircle };
            case 'high': return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', icon: AlertTriangle };
            case 'medium': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: Info };
            default: return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', icon: CheckCircle2 };
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass-panel p-4">
                <div className="flex items-center gap-3 flex-1 w-full">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter by action or user..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <Button variant="outline" size="sm" className="h-10 text-[10px] font-black uppercase tracking-widest gap-2 bg-white">
                        <Filter className="w-3.5 h-3.5" />
                        Module
                    </Button>
                </div>
                <Button variant="outline" size="sm" className="h-10 px-6 text-[10px] font-black uppercase tracking-widest gap-2 bg-white">
                    <Download className="w-3.5 h-3.5" />
                    Export Log
                </Button>
            </div>

            <div className="glass-panel overflow-hidden border-none shadow-xl shadow-slate-200/50">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Module</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Severity</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={6} className="px-6 py-6"><div className="h-4 bg-slate-100 rounded-lg w-full" /></td>
                                </tr>
                            ))
                        ) : logs.map((log) => {
                            const { bg, text, border, icon: Icon } = getSeverityStyles(log.severity);
                            return (
                                <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-900">{log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">{log.timestamp.toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600">
                                                {log.userName.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-900">{log.userName}</span>
                                                <span className="text-[9px] font-bold text-slate-400">{log.ipAddress || 'System'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">{log.action}</span>
                                            <span className="text-[9px] font-medium text-slate-400 truncate max-w-[200px]">{log.details}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest">
                                            {log.module}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest",
                                            bg, text, border
                                        )}>
                                            <Icon className="w-3 h-3" />
                                            {log.severity}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

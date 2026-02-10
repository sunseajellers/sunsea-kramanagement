'use client'

import { useState, useEffect } from 'react';
import AuditLog from './AuditLog';
import { getSecurityStats, getComplianceStatus, SecurityStats } from '@/lib/securityService';
import {
    Shield, ShieldCheck, ShieldAlert,
    Lock, Users, Fingerprint,
    Activity, Key, Globe, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function SecurityDashboard() {
    const [stats, setStats] = useState<SecurityStats | null>(null);
    const [compliance, setCompliance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [s, c] = await Promise.all([
                getSecurityStats(),
                getComplianceStatus()
            ]);
            setStats(s);
            setCompliance(c);
        } catch (error) {
            console.error('Failed to load security data');
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Shield className="w-12 h-12 animate-pulse text-primary/40" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Securing Infrastructure...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-200">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Security & Compliance</h1>
                        <p className="text-slate-500 font-medium mt-1">Audit logs, access control, and identity protection.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-11 px-6 border-slate-200 font-bold bg-white">
                        <Key className="w-4 h-4 mr-2" />
                        Permissions
                    </Button>
                    <Button className="btn-primary h-11 px-6 shadow-lg shadow-primary/20 font-bold">
                        <Lock className="w-4 h-4 mr-2" />
                        Force MFA
                    </Button>
                </div>
            </div>

            {/* Core Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Security Score', value: `${stats.healthScore}%`, icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Active Sessions', value: stats.activeSessions, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Critical Alerts', value: stats.criticalAlerts, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'System Uptime', value: `${stats.systemUptime}%`, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((stat) => (
                    <div key={stat.label} className="glass-panel p-6 flex items-center justify-between border-none shadow-lg">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                            <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
                        </div>
                        <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visual Security Analysis */}
                <Card className="lg:col-span-8 glass-panel p-8 border-none bg-slate-900 text-white relative overflow-hidden group">
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div className="p-4 rounded-3xl bg-white/10 backdrop-blur-md w-fit">
                                <Fingerprint className="w-10 h-10 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight leading-tight">Identity Protection</h3>
                                <p className="text-slate-400 font-medium mt-3 text-sm leading-relaxed">
                                    {stats.mfaEnabled}% of your users have enabled Multi-Factor Authentication. We recommend enforcing MFA for the Finance and HR departments.
                                </p>
                            </div>
                            <Button className="bg-white text-slate-900 font-black px-8 h-12 rounded-2xl hover:bg-slate-100 transition-all border-none">
                                Review MFA Adoption
                            </Button>
                        </div>

                        <div className="space-y-6 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Compliance Status</h4>
                            <div className="space-y-4">
                                {compliance.map((item) => (
                                    <div key={item.label} className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span>{item.label}</span>
                                            <span className={item.warn ? "text-rose-400" : "text-emerald-400"}>{item.status}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-1000", item.warn ? "bg-rose-500" : "bg-emerald-500")}
                                                style={{ width: `${item.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                        <Globe className="w-80 h-80" />
                    </div>
                </Card>

                {/* Quick Actions / Risk Alerts */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-panel p-6 border-none shadow-xl shadow-rose-100/20 bg-rose-50/30">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-rose-500 text-white">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                            <h3 className="font-black text-rose-600 text-xs uppercase tracking-widest">Immediate Attention</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-white border border-rose-100 hover:shadow-md transition-shadow">
                                <p className="text-xs font-black text-slate-900">Failed Login Spikes</p>
                                <p className="text-[10px] font-medium text-slate-500 mt-1">12 failed attempts from Bangalore, India (IP: 45.x.x.x)</p>
                                <Button className="w-full mt-3 h-8 text-[9px] font-black bg-rose-500 hover:bg-rose-600 text-white rounded-xl">
                                    Block Source IP
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-6 border-none">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Infrastructure Health</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Audit Stream', status: 'Stable', icon: Eye },
                                { label: 'Auth Gateway', status: 'Optimal', icon: Lock },
                                { label: 'Encryption Engine', status: 'Active', icon: ShieldCheck },
                            ].map((s) => (
                                <div key={s.label} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                                    <div className="flex items-center gap-3">
                                        <s.icon className="w-4 h-4 text-slate-400" />
                                        <span className="text-[10px] font-black uppercase text-slate-700">{s.label}</span>
                                    </div>
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Log Table */}
            <div className="space-y-6 pt-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">System Audit Stream</h2>
                </div>
                <AuditLog />
            </div>
        </div>
    );
}

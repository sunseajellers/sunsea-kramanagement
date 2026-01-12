// src/app/admin/system/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSystemHealth, updateSystemSettings, performSystemBackup, getSystemSettings, getDatabaseStats } from '@/lib/adminService';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Database,
    Activity,
    Download,
    Server,
    FileText,
    Lock,
    Unlock,
    ShieldCheck,
    Loader2,
    Users
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SystemStatus {
    database: 'healthy' | 'warning' | 'error';
    firestore: 'healthy' | 'warning' | 'error';
    authentication: 'healthy' | 'warning' | 'error';
    storage: 'healthy' | 'warning' | 'error';
    lastBackup: Date | null;
    uptime: number;
    activeUsers: number;
    totalUsers: number;
}

interface SystemSettings {
    maintenanceMode: boolean;
    allowRegistration: boolean;
    emailNotifications: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    logRetention: number; // days
    maxFileSize: number; // MB
    sessionTimeout: number; // minutes
}

export default function SystemAdminPage() {
    useAuth();
    const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [backupInProgress, setBackupInProgress] = useState(false);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [dbStats, setDbStats] = useState<{
        users: number;
        teams: number;
        tasks: number;
        kras: number;
        reports: number;
    } | null>(null);


    useEffect(() => {
        loadSystemData();
    }, []);

    const loadSystemData = async () => {
        setLoading(true);
        try {
            const [healthData, settingsData, dbStatsData] = await Promise.all([
                getSystemHealth(),
                getSystemSettings(),
                getDatabaseStats()
            ]);

            setSystemStatus(healthData);
            setSettings(settingsData);
            setMaintenanceMode(settingsData.maintenanceMode);
            setDbStats(dbStatsData);
        } catch (error) {
            console.error('Failed to load system data', error);
            toast.error('Failed to load system data');
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        if (!settings) return;

        setSaving(true);
        try {
            await updateSystemSettings(settings);
            toast.success('Settings synchronized');
        } catch (error) {
            console.error('Failed to save settings', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const performBackup = async () => {
        setBackupInProgress(true);
        try {
            await performSystemBackup();
            toast.success('Cold storage backup completed');
            loadSystemData(); // Refresh status
        } catch (error) {
            console.error('Backup failed', error);
            toast.error('Backup failed');
        } finally {
            setBackupInProgress(false);
        }
    };

    const toggleMaintenanceModeLocal = async (enabled: boolean) => {
        // Redefined to avoid conflict with imported updateSystemSettings
        try {
            if (settings) {
                const newSettings = { ...settings, maintenanceMode: enabled };
                await updateSystemSettings(newSettings);
                setSettings(newSettings);
                setMaintenanceMode(enabled);
                toast.success(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}`);
            }
        } catch (error) {
            console.error('Failed to toggle maintenance mode', error);
            toast.error('Failed to toggle maintenance mode');
        }
    };




    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scanning System Core...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-12">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">System Core</h1>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Server className="h-3 w-3 text-blue-500" />
                        Infrastructure monitor & configuration
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Access Level:</span>
                        <span className="text-[9px] font-black text-red-600 uppercase tracking-widest ml-2">Root Admin</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Diagnostic Data */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Heartbeat Monitor */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Diagnostic Heartbeat</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'CLOUD DATA', key: 'database' as const, icon: Database },
                                { label: 'FILE VAULT', key: 'storage' as const, icon: ShieldCheck },
                                { label: 'AUTH GATE', key: 'authentication' as const, icon: Lock },
                                { label: 'API LAYER', key: 'firestore' as const, icon: Activity }
                            ].map((item) => (
                                <div key={item.key} className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col items-center text-center gap-4 shadow-sm">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${systemStatus?.[item.key] === 'healthy' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500 animate-pulse'}`}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{item.label}</p>
                                        <p className={`text-[9px] font-black uppercase tracking-widest ${systemStatus?.[item.key] === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                                            {systemStatus?.[item.key] || 'ERR'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Meta Stats */}
                    <div className="grid grid-cols-3 gap-6">
                        {[
                            { label: 'SLA UPTIME', value: `${systemStatus?.uptime || 0}%`, icon: Activity },
                            { label: 'ACTIVE NODES', value: systemStatus?.activeUsers || 0, icon: Users },
                            { label: 'TOTAL ENTITIES', value: systemStatus?.totalUsers || 0, icon: Server }
                        ].map((stat) => (
                            <div key={stat.label} className="bg-gray-900 rounded-3xl p-6 text-white shadow-xl shadow-gray-100/50">
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">{stat.label}</p>
                                <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Resource Inventory */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Resource Inventory</h2>
                        <div className="bg-white border border-gray-100 rounded-3xl p-8 grid grid-cols-2 md:grid-cols-5 gap-6 shadow-sm">
                            {[
                                { label: 'PERSONNEL', val: dbStats?.users, color: 'text-blue-500' },
                                { label: 'TEAMS', val: dbStats?.teams, color: 'text-indigo-500' },
                                { label: 'OBJECTIVES', val: dbStats?.tasks, color: 'text-purple-500' },
                                { label: 'PROTOCOLS', val: dbStats?.kras, color: 'text-emerald-500' },
                                { label: 'REPORTS', val: dbStats?.reports, color: 'text-rose-500' }
                            ].map(s => (
                                <div key={s.label} className="space-y-1">
                                    <p className={`text-2xl font-black tracking-tighter ${s.color}`}>{s.val || 0}</p>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - System Controls */}
                <div className="space-y-8">
                    {/* Maintenance Protocol */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Integrity Control</h2>
                        <div className={`rounded-3xl p-8 border transition-all duration-500 ${maintenanceMode ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                            <div className="flex items-center justify-between mb-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${maintenanceMode ? 'bg-white text-red-600 shadow-sm' : 'bg-white text-green-600 shadow-sm'}`}>
                                    {maintenanceMode ? <Lock className="w-7 h-7" /> : <Unlock className="w-7 h-7" />}
                                </div>
                                <Switch
                                    checked={maintenanceMode}
                                    onCheckedChange={toggleMaintenanceModeLocal}
                                    className="data-[state=checked]:bg-red-600"
                                />
                            </div>
                            <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Maintenance State</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                                {maintenanceMode
                                    ? 'ENGINE RESTRICTED TO ROOT ACCESS ONLY'
                                    : 'ENGINE OPERATIONAL FOR ALL ACTIVE NODES'}
                            </p>
                        </div>
                    </div>

                    {/* Operational Actions */}
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Quick Operations</h2>
                        <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-3 shadow-sm">
                            <Button
                                variant="ghost"
                                onClick={performBackup}
                                disabled={backupInProgress}
                                className="w-full h-16 justify-between px-6 rounded-2xl hover:bg-blue-50 transition-all font-black text-gray-400 hover:text-blue-600 border border-transparent hover:border-blue-100"
                            >
                                <div className="flex items-center">
                                    {backupInProgress ? <Loader2 className="w-5 h-5 animate-spin mr-4" /> : <Download className="w-5 h-5 mr-4 opacity-30" />}
                                    <span className="text-[10px] uppercase tracking-widest">Snapshot Backup</span>
                                </div>
                                <div className="text-[9px] opacity-30 font-black">COLD STORAGE</div>
                            </Button>

                            <Button
                                variant="ghost"
                                className="w-full h-16 justify-between px-6 rounded-2xl hover:bg-purple-50 transition-all font-black text-gray-400 hover:text-purple-600 border border-transparent hover:border-purple-100"
                            >
                                <div className="flex items-center">
                                    <FileText className="w-5 h-5 mr-4 opacity-30" />
                                    <span className="text-[10px] uppercase tracking-widest">System Logs</span>
                                </div>
                                <div className="text-[9px] opacity-30 font-black">AUDIT TRAIL</div>
                            </Button>

                            {systemStatus?.lastBackup && (
                                <div className="mt-4 px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Last Deployment Sync</p>
                                    <p className="text-[10px] font-black text-gray-900">{new Date(systemStatus.lastBackup).toLocaleString().toUpperCase()}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Engine Parameters */}
            <div className="space-y-4">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Engine Parameters</h2>
                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                        <div className="space-y-3">
                            <Label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Backup Cycle</Label>
                            <select
                                value={settings?.backupFrequency}
                                onChange={(e) => setSettings(prev => prev ? { ...prev, backupFrequency: e.target.value as any } : null)}
                                className="w-full h-12 px-5 bg-gray-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-100 transition-all outline-none appearance-none cursor-pointer"
                            >
                                <option value="daily">CYCLE: DAILY</option>
                                <option value="weekly">CYCLE: WEEKLY</option>
                                <option value="monthly">CYCLE: MONTHLY</option>
                            </select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Log Retention</Label>
                            <Input
                                type="number"
                                value={settings?.logRetention}
                                onChange={(e) => setSettings(prev => prev ? { ...prev, logRetention: parseInt(e.target.value) } : null)}
                                className="h-12 px-5 bg-gray-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                            />
                            <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest ml-1">RETIENTION DAYS</p>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Max Payload</Label>
                            <Input
                                type="number"
                                value={settings?.maxFileSize}
                                onChange={(e) => setSettings(prev => prev ? { ...prev, maxFileSize: parseInt(e.target.value) } : null)}
                                className="h-12 px-5 bg-gray-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                            />
                            <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest ml-1">FILE SIZE (MB)</p>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Session TTL</Label>
                            <Input
                                type="number"
                                value={settings?.sessionTimeout}
                                onChange={(e) => setSettings(prev => prev ? { ...prev, sessionTimeout: parseInt(e.target.value) } : null)}
                                className="h-12 px-5 bg-gray-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                            />
                            <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest ml-1">TIMEOUT MINUTES</p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-10 mt-10 border-t border-gray-50">
                        <Button
                            onClick={saveSettings}
                            disabled={saving}
                            className="h-14 bg-gray-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] px-12 rounded-2xl shadow-xl transition-all disabled:opacity-30"
                        >
                            {saving ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                'Deploy Parameters'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
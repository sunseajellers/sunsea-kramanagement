// src/app/dashboard/admin/system/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSystemHealth, updateSystemSettings, performSystemBackup, getSystemSettings, getDatabaseStats } from '@/lib/adminService';
import { userHasPermission } from '@/lib/rbacService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Settings,
    Database,
    Shield,
    Activity,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Download,
    RefreshCw,
    Server,
    FileText,
    Lock,
    Unlock
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
    const { userData } = useAuth();
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

    const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null);

    useEffect(() => {
        const checkPermission = async () => {
            if (userData?.uid) {
                try {
                    const hasAccess = await userHasPermission(userData.uid, 'admin', 'access')
                    setHasAdminAccess(hasAccess)
                    if (hasAccess) {
                        loadSystemData();
                    }
                } catch (error) {
                    console.error('Error checking admin permission:', error)
                    setHasAdminAccess(false)
                }
            }
        }
        checkPermission()
    }, [userData]);

    const loadSystemData = async () => {
        setLoading(true);
        try {
            const [healthData, settingsData, dbStats] = await Promise.all([
                getSystemHealth(),
                getSystemSettings(),
                getDatabaseStats()
            ]);

            setSystemStatus(healthData);
            setSettings(settingsData);
            setMaintenanceMode(settingsData.maintenanceMode);
            setDbStats(dbStats);
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
            toast.success('Settings saved successfully');
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
            toast.success('System backup completed successfully');
            loadSystemData(); // Refresh status
        } catch (error) {
            console.error('Backup failed', error);
            toast.error('Backup failed');
        } finally {
            setBackupInProgress(false);
        }
    };

    const toggleMaintenanceMode = async (enabled: boolean) => {
        try {
            await toggleMaintenanceMode(enabled);
            setMaintenanceMode(enabled);
            if (settings) {
                setSettings({ ...settings, maintenanceMode: enabled });
            }
            toast.success(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error('Failed to toggle maintenance mode', error);
            toast.error('Failed to toggle maintenance mode');
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
            case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
            default: return <Activity className="h-5 w-5 text-gray-600" />;
        }
    };

    if (hasAdminAccess === false) {
        return (
            <div className="p-6">
                <div className="text-center">
                    <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                    <p className="text-muted-foreground">
                        You need system administrator privileges to access this page.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Settings className="h-6 w-6" />
                        System Administration
                    </h1>
                    <p className="text-muted-foreground">
                        Advanced system management and configuration
                    </p>
                </div>
                <Badge variant="destructive" className="text-xs">
                    SYSTEM ADMIN ONLY
                </Badge>
            </div>

            {/* System Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        System Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-2">
                                {getStatusIcon(systemStatus?.database || 'error')}
                                <span className="text-sm font-medium">Database</span>
                            </div>
                            <Badge variant={systemStatus?.database === 'healthy' ? 'default' : 'destructive'}>
                                {systemStatus?.database}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-2">
                                {getStatusIcon(systemStatus?.firestore || 'error')}
                                <span className="text-sm font-medium">Firestore</span>
                            </div>
                            <Badge variant={systemStatus?.firestore === 'healthy' ? 'default' : 'destructive'}>
                                {systemStatus?.firestore}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-2">
                                {getStatusIcon(systemStatus?.authentication || 'error')}
                                <span className="text-sm font-medium">Auth</span>
                            </div>
                            <Badge variant={systemStatus?.authentication === 'healthy' ? 'default' : 'destructive'}>
                                {systemStatus?.authentication}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-2">
                                {getStatusIcon(systemStatus?.storage || 'error')}
                                <span className="text-sm font-medium">Storage</span>
                            </div>
                            <Badge variant={systemStatus?.storage === 'healthy' ? 'default' : 'destructive'}>
                                {systemStatus?.storage}
                            </Badge>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-muted rounded">
                            <div className="text-2xl font-bold">{systemStatus?.uptime}%</div>
                            <div className="text-sm text-muted-foreground">Uptime</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded">
                            <div className="text-2xl font-bold">{systemStatus?.activeUsers}</div>
                            <div className="text-sm text-muted-foreground">Active Users</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded">
                            <div className="text-2xl font-bold">{systemStatus?.totalUsers}</div>
                            <div className="text-sm text-muted-foreground">Total Users</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Database Statistics */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Database Statistics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="text-center p-4 border rounded">
                            <div className="text-3xl font-bold text-blue-600">{dbStats?.users || 0}</div>
                            <div className="text-sm text-muted-foreground">Users</div>
                        </div>
                        <div className="text-center p-4 border rounded">
                            <div className="text-3xl font-bold text-green-600">{dbStats?.teams || 0}</div>
                            <div className="text-sm text-muted-foreground">Teams</div>
                        </div>
                        <div className="text-center p-4 border rounded">
                            <div className="text-3xl font-bold text-purple-600">{dbStats?.tasks || 0}</div>
                            <div className="text-sm text-muted-foreground">Tasks</div>
                        </div>
                        <div className="text-center p-4 border rounded">
                            <div className="text-3xl font-bold text-orange-600">{dbStats?.kras || 0}</div>
                            <div className="text-sm text-muted-foreground">KRAs</div>
                        </div>
                        <div className="text-center p-4 border rounded">
                            <div className="text-3xl font-bold text-red-600">{dbStats?.reports || 0}</div>
                            <div className="text-sm text-muted-foreground">Reports</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        System Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Maintenance Mode */}
                    <div className="flex items-center justify-between p-4 border rounded">
                        <div className="flex items-center gap-3">
                            {maintenanceMode ? (
                                <Lock className="h-5 w-5 text-red-500" />
                            ) : (
                                <Unlock className="h-5 w-5 text-green-500" />
                            )}
                            <div>
                                <div className="font-medium">Maintenance Mode</div>
                                <div className="text-sm text-muted-foreground">
                                    Put the system in maintenance mode for updates
                                </div>
                            </div>
                        </div>
                        <Switch
                            checked={maintenanceMode}
                            onCheckedChange={toggleMaintenanceMode}
                        />
                    </div>

                    {/* Other Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Backup Frequency</label>
                            <select
                                value={settings?.backupFrequency}
                                onChange={(e) => setSettings(prev => prev ? { ...prev, backupFrequency: e.target.value as any } : null)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Log Retention (days)</label>
                            <Input
                                type="number"
                                value={settings?.logRetention}
                                onChange={(e) => setSettings(prev => prev ? { ...prev, logRetention: parseInt(e.target.value) } : null)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Max File Size (MB)</label>
                            <Input
                                type="number"
                                value={settings?.maxFileSize}
                                onChange={(e) => setSettings(prev => prev ? { ...prev, maxFileSize: parseInt(e.target.value) } : null)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
                            <Input
                                type="number"
                                value={settings?.sessionTimeout}
                                onChange={(e) => setSettings(prev => prev ? { ...prev, sessionTimeout: parseInt(e.target.value) } : null)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={saveSettings} disabled={saving}>
                            {saving ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Save Settings
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* System Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        System Actions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Button
                            variant="outline"
                            onClick={performBackup}
                            disabled={backupInProgress}
                            className="h-20 flex-col gap-2"
                        >
                            {backupInProgress ? (
                                <RefreshCw className="h-6 w-6 animate-spin" />
                            ) : (
                                <Download className="h-6 w-6" />
                            )}
                            <span>{backupInProgress ? 'Backing up...' : 'Create Backup'}</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-20 flex-col gap-2"
                        >
                            <Database className="h-6 w-6" />
                            <span>Database Health</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-20 flex-col gap-2"
                        >
                            <FileText className="h-6 w-6" />
                            <span>View Logs</span>
                        </Button>
                    </div>

                    {systemStatus?.lastBackup && (
                        <div className="mt-4 p-3 bg-muted rounded">
                            <div className="text-sm">
                                <strong>Last Backup:</strong> {systemStatus.lastBackup.toLocaleString()}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
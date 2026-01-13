'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSystemHealth, getDatabaseStats, performSystemBackup, toggleMaintenanceMode } from '@/lib/adminService'
import { Server, Database, Shield, Cloud, Activity, HardDrive, Users, FileText, Save, Settings, Clock, ToggleLeft, ToggleRight, Loader2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

interface SystemHealth {
    database: 'healthy' | 'warning' | 'error'
    firestore: 'healthy' | 'warning' | 'error'
    authentication: 'healthy' | 'warning' | 'error'
    storage: 'healthy' | 'warning' | 'error'
    lastBackup: Date | null
    uptime: number
    activeUsers: number
    totalUsers: number
}

interface DbStats {
    users: number
    teams: number
    tasks: number
    kras: number
    reports: number
}

export default function AdminSystemPage() {
    const { user, loading: authLoading } = useAuth()
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
    const [dbStats, setDbStats] = useState<DbStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [backingUp, setBackingUp] = useState(false)

    // Settings state
    const [settings, setSettings] = useState({
        backupFrequency: 'daily',
        logRetention: '30',
        maxFileSize: '10',
        sessionTimeout: '60'
    })

    useEffect(() => {
        if (!authLoading && user) {
            loadSystemData()
        }
    }, [authLoading, user])

    const loadSystemData = async () => {
        try {
            setLoading(true)
            const [healthData, statsData] = await Promise.all([
                getSystemHealth(),
                getDatabaseStats()
            ])
            setSystemHealth(healthData)
            setDbStats(statsData)
        } catch (error) {
            console.error('Failed to load system data', error)
            toast.error('Failed to load system data')
        } finally {
            setLoading(false)
        }
    }

    const handleBackup = async () => {
        setBackingUp(true)
        try {
            await performSystemBackup()
            toast.success('Backup initiated successfully')
            loadSystemData()
        } catch (error) {
            toast.error('Failed to initiate backup')
        } finally {
            setBackingUp(false)
        }
    }

    const handleMaintenanceToggle = async () => {
        try {
            await toggleMaintenanceMode(!maintenanceMode)
            setMaintenanceMode(!maintenanceMode)
            toast.success(`Maintenance mode ${!maintenanceMode ? 'enabled' : 'disabled'}`)
        } catch (error) {
            toast.error('Failed to toggle maintenance mode')
        }
    }

    const getStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
        switch (status) {
            case 'healthy':
                return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'warning':
                return <AlertTriangle className="w-4 h-4 text-amber-500" />
            case 'error':
                return <XCircle className="w-4 h-4 text-red-500" />
        }
    }

    const getStatusBadge = (status: 'healthy' | 'warning' | 'error') => {
        switch (status) {
            case 'healthy':
                return 'badge-success'
            case 'warning':
                return 'badge-warning'
            case 'error':
                return 'badge-danger'
        }
    }

    if (loading || authLoading) {
        return (
            <div className="page-container flex-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center animate-pulse">
                        <Server className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Loading system status...</p>
                </div>
            </div>
        )
    }

    const services = [
        { name: 'Database', status: systemHealth?.database || 'error', icon: Database },
        { name: 'Firestore', status: systemHealth?.firestore || 'error', icon: Cloud },
        { name: 'Authentication', status: systemHealth?.authentication || 'error', icon: Shield },
        { name: 'Storage', status: systemHealth?.storage || 'error', icon: HardDrive }
    ]

    return (
        <div className="page-container">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">System Administration</h1>
                    <p className="text-gray-400 text-xs font-medium flex items-center gap-1.5 mt-0.5">
                        <Server className="h-3 w-3 text-rose-500" />
                        Health monitoring & configuration
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={loadSystemData} className="h-9 px-4 rounded-xl text-xs font-medium border-gray-200">
                        <Activity className="w-3.5 h-3.5 mr-1.5" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="flex-1 grid grid-cols-3 gap-5 min-h-0">
                {/* Left Column - Health & Stats */}
                <div className="col-span-2 flex flex-col gap-4 min-h-0">
                    {/* Service Health */}
                    <div className="glass-card p-5">
                        <h3 className="text-xs font-semibold text-gray-500 mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Service Health
                        </h3>
                        <div className="grid grid-cols-4 gap-3">
                            {services.map((service) => (
                                <div key={service.name} className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="icon-box icon-box-sm bg-white text-gray-500 shadow-sm">
                                            <service.icon className="w-4 h-4" />
                                        </div>
                                        {getStatusIcon(service.status as any)}
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900 mb-1">{service.name}</p>
                                    <span className={`badge ${getStatusBadge(service.status as any)}`}>
                                        {service.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* System Stats */}
                    <div className="glass-card p-5">
                        <h3 className="text-xs font-semibold text-gray-500 mb-4 flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            Resource Inventory
                        </h3>
                        <div className="grid grid-cols-5 gap-3">
                            {[
                                { label: 'Users', value: dbStats?.users || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { label: 'Teams', value: dbStats?.teams || 0, icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                { label: 'Tasks', value: dbStats?.tasks || 0, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { label: 'KRAs', value: dbStats?.kras || 0, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
                                { label: 'Reports', value: dbStats?.reports || 0, icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50' }
                            ].map((stat, i) => (
                                <div key={i} className="text-center p-4 rounded-xl bg-gray-50">
                                    <div className={`w-10 h-10 mx-auto rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-2`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900">{stat.value}</h4>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Engine Parameters */}
                    <div className="glass-card p-5 flex-1 scroll-panel">
                        <h3 className="text-xs font-semibold text-gray-500 mb-4 flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Engine Parameters
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-400">Backup Frequency</label>
                                <select
                                    value={settings.backupFrequency}
                                    onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200"
                                >
                                    <option value="hourly">Hourly</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-400">Log Retention (days)</label>
                                <input
                                    type="number"
                                    value={settings.logRetention}
                                    onChange={(e) => setSettings({ ...settings, logRetention: e.target.value })}
                                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-400">Max File Size (MB)</label>
                                <input
                                    type="number"
                                    value={settings.maxFileSize}
                                    onChange={(e) => setSettings({ ...settings, maxFileSize: e.target.value })}
                                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-400">Session Timeout (min)</label>
                                <input
                                    type="number"
                                    value={settings.sessionTimeout}
                                    onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Controls & Status */}
                <div className="flex flex-col gap-4">
                    {/* Meta Stats */}
                    <div className="glass-card p-5">
                        <h3 className="text-xs font-semibold text-gray-500 mb-4">System Status</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Uptime</span>
                                <span className="text-sm font-bold text-green-600">{systemHealth?.uptime || 99.9}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Active Users</span>
                                <span className="text-sm font-bold text-gray-900">{systemHealth?.activeUsers || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Last Backup</span>
                                <span className="text-xs font-medium text-gray-500">
                                    {systemHealth?.lastBackup
                                        ? new Date(systemHealth.lastBackup).toLocaleDateString()
                                        : 'Never'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Maintenance Mode */}
                    <div className={`glass-card p-5 ${maintenanceMode ? 'ring-2 ring-amber-200' : ''}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-semibold text-gray-500">Maintenance Mode</h3>
                            <button
                                onClick={handleMaintenanceToggle}
                                className="focus:outline-none"
                            >
                                {maintenanceMode ? (
                                    <ToggleRight className="w-8 h-8 text-amber-500" />
                                ) : (
                                    <ToggleLeft className="w-8 h-8 text-gray-300" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">
                            {maintenanceMode
                                ? 'System is in maintenance mode. Users cannot access the platform.'
                                : 'Enable to restrict user access during updates.'}
                        </p>
                        <span className={`badge ${maintenanceMode ? 'badge-warning' : 'badge-neutral'}`}>
                            {maintenanceMode ? 'Active' : 'Inactive'}
                        </span>
                    </div>

                    {/* Backup Control */}
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="icon-box icon-box-md bg-blue-50 text-blue-600">
                                <Save className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">System Backup</h3>
                                <p className="text-[10px] text-gray-400">Create a full system backup</p>
                            </div>
                        </div>
                        <Button
                            onClick={handleBackup}
                            disabled={backingUp}
                            className="w-full h-10 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-medium"
                        >
                            {backingUp ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Backing Up...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Start Backup
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Quick Actions */}
                    <div className="glass-card p-5 flex-1">
                        <h3 className="text-xs font-semibold text-gray-500 mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Scheduled Tasks
                        </h3>
                        <div className="space-y-2">
                            {[
                                { name: 'Daily Backup', time: '02:00 AM', status: 'active' },
                                { name: 'Cache Clear', time: '04:00 AM', status: 'active' },
                                { name: 'Log Cleanup', time: '03:00 AM', status: 'paused' }
                            ].map((task, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-900">{task.name}</p>
                                        <p className="text-[10px] text-gray-400">{task.time}</p>
                                    </div>
                                    <span className={`badge ${task.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                                        {task.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
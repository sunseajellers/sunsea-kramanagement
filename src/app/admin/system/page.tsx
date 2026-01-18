'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSystemHealth, getDatabaseStats, performSystemBackup, toggleMaintenanceMode } from '@/lib/adminService'
import { Server, Database, Shield, Cloud, Activity, HardDrive, Users, FileText, Save, Settings, Clock, ToggleLeft, ToggleRight, Loader2, CheckCircle, AlertTriangle, XCircle, Calendar } from 'lucide-react'
import HolidayManager from '@/components/admin/HolidayManager'
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
            <div className="h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center animate-pulse">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Refresh button */}
            <div className="flex items-center justify-end mb-6">
                <Button variant="outline" onClick={loadSystemData}>
                    <Activity className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Service Health */}
            <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Service Health</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {services.map((service) => (
                        <div key={service.name} className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <service.icon className="w-8 h-8 text-gray-400" />
                                {getStatusIcon(service.status as any)}
                            </div>
                            <p className="text-sm font-semibold text-gray-900 mb-2">{service.name}</p>
                            <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                                service.status === 'healthy' ? 'bg-green-100 text-green-700' :
                                service.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                                {service.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Database Stats */}
            <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Database Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {[
                        { label: 'Users', value: dbStats?.users || 0, icon: Users, color: 'blue' },
                        { label: 'Teams', value: dbStats?.teams || 0, icon: Shield, color: 'indigo' },
                        { label: 'Tasks', value: dbStats?.tasks || 0, icon: FileText, color: 'emerald' },
                        { label: 'KRAs', value: dbStats?.kras || 0, icon: Activity, color: 'amber' },
                        { label: 'Reports', value: dbStats?.reports || 0, icon: FileText, color: 'rose' }
                    ].map((stat, i) => (
                        <div key={i} className="p-6 bg-white rounded-2xl border border-gray-100 text-center shadow-sm">
                            <div className={`w-12 h-12 mx-auto rounded-xl bg-${stat.color}-50 flex items-center justify-center mb-3`}>
                                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                            </div>
                            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                            <p className="text-xs text-gray-600 font-medium">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* System Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Maintenance Mode */}
                <div className={`p-6 bg-white rounded-2xl border shadow-sm ${maintenanceMode ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-900">Maintenance Mode</h3>
                        <button onClick={handleMaintenanceToggle} className="focus:outline-none">
                            {maintenanceMode ? (
                                <ToggleRight className="w-8 h-8 text-amber-500" />
                            ) : (
                                <ToggleLeft className="w-8 h-8 text-gray-300" />
                            )}
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                        {maintenanceMode 
                            ? 'System is in maintenance mode. Users cannot access the platform.'
                            : 'System is operational. All users can access the platform.'}
                    </p>
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${
                        maintenanceMode ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    }`}>
                        {maintenanceMode ? 'Active' : 'Inactive'}
                    </span>
                </div>

                {/* Backup Control */}
                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">System Backup</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Create a backup of all system data and configurations.
                    </p>
                    <Button 
                        onClick={handleBackup} 
                        disabled={backingUp}
                        className="w-full"
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

                {/* Holiday Manager */}
                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Holiday Calendar
                    </h3>
                    <HolidayManager />
                </div>
            </div>
        </div>
    );
}
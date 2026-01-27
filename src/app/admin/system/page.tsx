'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSystemHealth, getDatabaseStats, performSystemBackup, toggleMaintenanceMode } from '@/lib/adminService'
import { Database, Shield, Cloud, Activity, HardDrive, Users, FileText, Save, ToggleLeft, ToggleRight, Loader2, CheckCircle, AlertTriangle, XCircle, Calendar } from 'lucide-react'
import HolidayManager from '@/components/admin/HolidayManager'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
        <div className="space-y-10 animate-in">
            {/* Header */}
            <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="section-title">Core Infrastructure</h1>
                    <p className="section-subtitle">System health, database integrity, and operational maintenance controls</p>
                </div>
                <Button onClick={loadSystemData} className="btn-secondary h-11">
                    <Activity className="h-4 w-4 mr-2" />
                    Synchronize Health
                </Button>
            </div>

            {/* Service Health */}
            <div className="space-y-6">
                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Hardware & Service Matrix</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {services.map((service) => (
                        <div key={service.name} className="glass-panel p-6 border-slate-100 group">
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-white transition-colors">
                                    <service.icon className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                </div>
                                {getStatusIcon(service.status as any)}
                            </div>
                            <p className="text-sm font-bold text-slate-900 mb-1">{service.name}</p>
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full animate-pulse",
                                    service.status === 'healthy' ? "bg-emerald-500" :
                                        service.status === 'warning' ? "bg-amber-500" : "bg-rose-500"
                                )} />
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-widest",
                                    service.status === 'healthy' ? "text-emerald-600" :
                                        service.status === 'warning' ? "text-amber-600" : "text-rose-600"
                                )}>
                                    {service.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Database Stats */}
            <div className="space-y-6">
                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Database Population Metrics</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {[
                        { label: 'Active Users', value: dbStats?.users || 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Department Units', value: dbStats?.teams || 0, icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Tactical Tasks', value: dbStats?.tasks || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Strategic KRAs', value: dbStats?.kras || 0, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Analytical Reports', value: dbStats?.reports || 0, icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50' }
                    ].map((stat, i) => (
                        <div key={i} className="dashboard-card">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={cn("p-2 rounded-xl", stat.bg)}>
                                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 leading-none">{stat.value}</h3>
                        </div>
                    ))}
                </div>
            </div>

            {/* System Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Maintenance Mode */}
                <div className={cn(
                    "glass-panel p-8 transition-all relative overflow-hidden",
                    maintenanceMode ? "bg-amber-50/50 border-amber-200" : "border-slate-100"
                )}>
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Maintenance Mode</h3>
                        <button onClick={handleMaintenanceToggle} className="focus:outline-none hover:scale-110 transition-transform">
                            {maintenanceMode ? (
                                <ToggleRight className="w-10 h-10 text-amber-500" />
                            ) : (
                                <ToggleLeft className="w-10 h-10 text-slate-200" />
                            )}
                        </button>
                    </div>
                    <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed relative z-10">
                        {maintenanceMode
                            ? 'The platform is currently locked for tactical maintenance. All non-admin traffic is restricted.'
                            : 'The platform is operational. All authorized personnel have full access to standard protocols.'}
                    </p>
                    <div className={cn(
                        "inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest relative z-10",
                        maintenanceMode ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    )}>
                        {maintenanceMode ? 'Active Lockdown' : 'Nominal Operations'}
                    </div>
                </div>

                {/* Backup Control */}
                <div className="glass-panel p-8 border-slate-100">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight mb-4">Data Archivation</h3>
                    <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
                        Manually trigger a full snapshot of the Firestore collections and system configurations.
                    </p>
                    <Button
                        onClick={handleBackup}
                        disabled={backingUp}
                        className="w-full btn-primary h-12"
                    >
                        {backingUp ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Synchronizing...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Execute Full Backup
                            </>
                        )}
                    </Button>
                </div>

                {/* Holiday Manager */}
                <div className="glass-panel p-8 border-slate-100 h-full flex flex-col">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6 flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                        Operational Holidays
                    </h3>
                    <div className="flex-1">
                        <HolidayManager />
                    </div>
                </div>
            </div>
        </div>
    );
}
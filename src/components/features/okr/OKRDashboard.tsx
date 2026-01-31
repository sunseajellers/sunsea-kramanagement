'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Target, TrendingUp, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import type { Objective, OKRStats } from '@/types'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

import { CreateObjectiveModal } from './CreateObjectiveModal'

import { authenticatedJsonFetch } from '@/lib/apiClient'

export function OKRDashboard() {
    const [objectives, setObjectives] = useState<Objective[]>([])
    const [stats, setStats] = useState<OKRStats | null>(null)
    const [filter, setFilter] = useState<'all' | 'quarterly' | 'yearly'>('all')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all')
    const [loading, setLoading] = useState(true)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    useEffect(() => {
        fetchData()
    }, [filter, statusFilter])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Fetch objectives
            const params = new URLSearchParams()
            if (filter !== 'all') {
                params.append('timeframe', filter)
            }
            if (statusFilter !== 'all') {
                params.append('status', statusFilter)
            }

            const objectivesRes = await authenticatedJsonFetch(`/api/okrs/objectives?${params}`)
            if (objectivesRes.success) {
                setObjectives(objectivesRes.data)
            }

            // Fetch stats
            const statsRes = await authenticatedJsonFetch('/api/okrs/stats')
            if (statsRes.success) {
                setStats(statsRes.data)
            }
        } catch (error) {
            console.error('Error fetching OKRs:', error)
            toast.error('Failed to load OKRs')
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const variants = {
            draft: { className: 'bg-gray-100 text-gray-800', label: 'Draft' },
            active: { className: 'bg-blue-100 text-blue-800', label: 'Active' },
            completed: { className: 'bg-green-100 text-green-800', label: 'Completed' },
            cancelled: { className: 'bg-red-100 text-red-800', label: 'Cancelled' }
        }
        const config = variants[status as keyof typeof variants] || variants.draft
        return <Badge className={config.className}>{config.label}</Badge>
    }

    const getProgressColor = (progress: number) => {
        if (progress >= 70) return 'bg-green-500'
        if (progress >= 40) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    const getProgressStatus = (progress: number) => {
        if (progress >= 70) return { icon: CheckCircle2, text: 'On Track', color: 'text-green-600' }
        if (progress >= 40) return { icon: TrendingUp, text: 'At Risk', color: 'text-yellow-600' }
        return { icon: AlertCircle, text: 'Behind', color: 'text-red-600' }
    }

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="section-title">OKR Strategy</h1>
                    <p className="section-subtitle">
                        Measuring mission-critical objectives and quantifiable key results
                    </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    New Objective
                </Button>
            </div>

            <CreateObjectiveModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchData}
            />

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {[
                        { label: 'Total OKRs', value: stats.total, icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Avg Progress', value: `${stats.avgProgress}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'On Track', value: stats.onTrack, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'OPTIMAL' },
                        { label: 'At Risk', value: stats.atRisk, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', sub: 'CRITICAL' },
                    ].map((s, i) => (
                        <div key={i} className="dashboard-card py-6 px-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn("p-2 rounded-xl", s.bg)}>
                                    <s.icon className={cn("h-4 w-4", s.color)} />
                                </div>
                                {s.sub && (
                                    <span className={cn("text-[9px] font-black uppercase tracking-widest", s.color)}>
                                        {s.sub}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] font-bold text-slate-500 mb-1">{s.label}</p>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{s.value}</h3>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-100/40 p-2 rounded-2xl border border-slate-200/50">
                <div className="flex bg-white/50 p-1 rounded-xl shadow-sm border border-slate-200/50">
                    {['all', 'quarterly', 'yearly'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={cn(
                                "px-5 py-2 text-xs font-bold capitalize rounded-lg transition-all",
                                filter === f ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {f === 'all' ? 'All Periods' : f}
                        </button>
                    ))}
                </div>

                <div className="flex bg-white/50 p-1 rounded-xl shadow-sm border border-slate-200/50">
                    {['all', 'active', 'completed'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s as any)}
                            className={cn(
                                "px-5 py-2 text-xs font-bold capitalize rounded-lg transition-all",
                                statusFilter === s ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {s === 'all' ? 'All Status' : s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Objectives List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Compiling Intelligence</p>
                </div>
            ) : objectives.length === 0 ? (
                <div className="glass-panel p-20 text-center flex flex-col items-center max-w-2xl mx-auto">
                    <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6">
                        <Target className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">No Strategic Objectives</h3>
                    <p className="text-slate-500 font-medium mb-8">
                        The registry is currently empty. Initialize your organization's strategy by creating the first objective.
                    </p>
                    <Button onClick={() => setIsCreateModalOpen(true)} className="btn-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Initialize Strategy
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {objectives.map((objective) => {
                        const progressStatus = getProgressStatus(objective.progress)
                        const StatusIcon = progressStatus.icon

                        return (
                            <div key={objective.id} className="glass-panel p-8 relative overflow-hidden group hover:translate-x-1">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none transition-transform group-hover:scale-110">
                                    <Target className="w-32 h-32" />
                                </div>

                                <div className="relative z-10">
                                    {/* Item Header */}
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                                    {objective.title}
                                                </h3>
                                                {getStatusBadge(objective.status)}
                                            </div>
                                            <p className="text-slate-500 font-medium leading-relaxed max-w-3xl">
                                                {objective.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100/60 self-start">
                                            <StatusIcon className={cn("w-4 h-4", progressStatus.color)} />
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest", progressStatus.color)}>
                                                {progressStatus.text}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Operational Load (Progress) */}
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-end">
                                        <div className="lg:col-span-3 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Aggregate Velocity</span>
                                                <span className="text-sm font-black text-slate-900">{objective.progress}%</span>
                                            </div>
                                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full transition-all duration-1000 ease-out", getProgressColor(objective.progress))}
                                                    style={{ width: `${objective.progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1 text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Deadline</p>
                                            <p className="text-sm font-black text-slate-900">
                                                {format(new Date(objective.endDate), 'MMMM dd, yyyy')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Data Metadata Footer */}
                                    <div className="mt-10 pt-8 border-t border-slate-100/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex flex-wrap items-center gap-y-4 gap-x-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200">
                                                    {objective.ownerName.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Owner</span>
                                                    <span className="text-xs font-bold text-slate-700">{objective.ownerName}</span>
                                                </div>
                                            </div>

                                            {objective.teamName && (
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Unit</span>
                                                    <span className="text-xs font-bold text-slate-700">{objective.teamName}</span>
                                                </div>
                                            )}

                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Cycle</span>
                                                <span className="text-xs font-bold text-slate-700 uppercase">{objective.timeframe}{objective.quarter && ` Q${objective.quarter}`}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4 text-indigo-500" />
                                                <span className="text-xs font-bold text-slate-500">
                                                    {objective.keyResultIds.length} Key Results
                                                </span>
                                            </div>
                                            <Button variant="ghost" className="btn-secondary h-10">
                                                Insight View
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

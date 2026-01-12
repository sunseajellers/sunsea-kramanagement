'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchKRAs, deleteKRA } from '@/lib/kraService'
import { KRA, KRAType } from '@/types'
import { Loader2, Trash2, Edit, Calendar, Target, Filter, BarChart2 } from 'lucide-react'
import { getAllTeams } from '@/lib/teamService'
import KPIEditor from './KPIEditor'

export default function KRAList({ onEdit }: { onEdit: (kra: KRA) => void }) {
    const { user } = useAuth()
    const [kras, setKras] = useState<KRA[]>([])
    const [loading, setLoading] = useState(true)
    const [filterType, setFilterType] = useState<KRAType | 'all'>('all')
    const [selectedKRAForKPI, setSelectedKRAForKPI] = useState<KRA | null>(null)
    const [teams, setTeams] = useState<any[]>([])

    const filteredKras = filterType === 'all' ? kras : kras.filter(kra => kra.type === filterType)

    useEffect(() => {
        const loadData = async () => {
            if (!user) return
            setLoading(true)
            try {
                const [kraData, teamData] = await Promise.all([
                    fetchKRAs(user.uid),
                    getAllTeams()
                ])
                setKras(kraData)
                setTeams(teamData)
            } catch (error) {
                console.error("Failed to load KRAs or teams", error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [user])

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
            try {
                await deleteKRA(id)
                // Optimistic update or reload
                setKras(prev => prev.filter(k => k.id !== id))
            } catch (error) {
                alert('Failed to delete goal')
            }
        }
    }

    const getPriorityBadge = (priority: string) => {
        const badges = {
            low: 'bg-green-100 text-green-700 border-green-200',
            medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            high: 'bg-orange-100 text-orange-700 border-orange-200',
            critical: 'bg-red-100 text-red-700 border-red-200'
        }
        const icons = {
            low: '🟢',
            medium: '🟡',
            high: '🟠',
            critical: '🔴'
        }
        return { className: badges[priority as keyof typeof badges], icon: icons[priority as keyof typeof icons] }
    }

    const getStatusBadge = (status: string) => {
        const badges = {
            not_started: 'bg-gray-100 text-gray-700 border-gray-200',
            in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
            completed: 'bg-green-100 text-green-700 border-green-200'
        }
        const icons = {
            not_started: '⚪',
            in_progress: '🔵',
            completed: '✅'
        }
        const labels = {
            not_started: 'Not Started',
            in_progress: 'In Progress',
            completed: 'Completed'
        }
        return {
            className: badges[status as keyof typeof badges],
            icon: icons[status as keyof typeof icons],
            label: labels[status as keyof typeof labels]
        }
    }

    const getTypeBadge = (type: string) => {
        const icons = {
            daily: '📅',
            weekly: '📆',
            monthly: '🗓️'
        }
        return icons[type as keyof typeof icons] || '📋'
    }

    const getTeamNames = (teamIds: string[]) => {
        return teamIds.map(id => {
            const team = teams.find(t => t.id === id)
            return team ? team.name : 'Unknown Team'
        }).join(', ')
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-4" />
                <p className="text-gray-500 font-medium">Loading your goals...</p>
            </div>
        )
    }

    if (kras.length === 0) {
        return (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No Goals Found</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                    You haven't created any goals yet. Click the "Create New Goal" button to get started.
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-6">
                {/* Filter Bar - Simplified */}
                <div className="bg-white rounded-xl border p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Filter by Type:</span>
                        </div>
                        <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar scroll-smooth">
                            {[
                                { value: 'all', label: `All (${kras.length})` },
                                { value: 'daily', label: `Daily (${kras.filter(k => k.type === 'daily').length})` },
                                { value: 'weekly', label: `Weekly (${kras.filter(k => k.type === 'weekly').length})` },
                                { value: 'monthly', label: `Monthly (${kras.filter(k => k.type === 'monthly').length})` }
                            ].map((item) => (
                                <button
                                    key={item.value}
                                    onClick={() => setFilterType(item.value as any)}
                                    className={`flex-shrink-0 px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-tighter transition-all ${filterType === item.value
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* KRA Grid - Simplified */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredKras.map((kra) => {
                        const priority = getPriorityBadge(kra.priority)
                        const status = getStatusBadge(kra.status)
                        const typeIcon = getTypeBadge(kra.type)

                        return (
                            <div
                                key={kra.id}
                                className="group bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 hover:border-blue-200 transition-all duration-200 relative overflow-hidden flex flex-col h-full shadow-sm"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xl sm:text-2xl">{typeIcon}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{kra.type}</span>
                                    </div>
                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setSelectedKRAForKPI(kra)}
                                            className="p-1.5 sm:p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                            title="Manage KPIs"
                                        >
                                            <BarChart2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onEdit(kra)}
                                            className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(kra.id)}
                                            className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-2">
                                    {kra.title}
                                </h3>

                                <p className="text-gray-500 mb-4 line-clamp-2 text-xs h-8">
                                    {kra.description}
                                </p>

                                <div className="space-y-4 mt-auto">
                                    {/* Progress Section - Simplified */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Progress</span>
                                            <span className="text-[10px] font-bold text-blue-600">{kra.progress || 0}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${kra.progress || 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center text-[10px] font-bold text-gray-500 bg-gray-50 p-2 rounded-lg uppercase tracking-tighter">
                                        <Target className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                                        <span className="truncate">{kra.target}</span>
                                    </div>

                                    {/* Team Assignment Display */}
                                    {kra.teamIds && kra.teamIds.length > 0 && (
                                        <div className="flex items-center text-[10px] font-bold text-blue-600 bg-blue-50 p-2 rounded-lg uppercase tracking-tighter">
                                            <span className="w-3.5 h-3.5 mr-2">👥</span>
                                            <span className="truncate">
                                                {getTeamNames(kra.teamIds)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Priority and Status Badges */}
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tighter ${priority.className}`}>
                                            {kra.priority}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tighter ${status.className}`}>
                                            {status.label}
                                        </span>
                                    </div>

                                    <div className="flex items-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                        <Calendar className="w-3 h-3 mr-1.5" />
                                        <span>
                                            {new Date(kra.startDate).toLocaleDateString()} –{' '}
                                            {new Date(kra.endDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {
                    filteredKras.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-gray-500">No {filterType} goals found.</p>
                        </div>
                    )
                }
            </div>

            {/* KPI Editor Modal */}
            {
                selectedKRAForKPI && (
                    <KPIEditor
                        kra={selectedKRAForKPI}
                        onClose={() => setSelectedKRAForKPI(null)}
                    />
                )
            }
        </>
    )
}

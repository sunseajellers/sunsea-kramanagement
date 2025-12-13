'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchKRAs, deleteKRA } from '@/lib/kraService'
import { KRA, KRAType } from '@/types'
import { Loader2, Trash2, Edit, Calendar, Target, Filter } from 'lucide-react'

export default function KRAList({ onEdit }: { onEdit: (kra: KRA) => void }) {
    const { user } = useAuth()
    const [kras, setKras] = useState<KRA[]>([])
    const [loading, setLoading] = useState(true)
    const [filterType, setFilterType] = useState<KRAType | 'all'>('all')

    const loadKras = async () => {
        if (!user) return
        setLoading(true)
        try {
            const data = await fetchKRAs(user.uid)
            setKras(data)
        } catch (error) {
            console.error("Failed to load KRAs", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadKras()
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

    const filteredKras = filterType === 'all'
        ? kras
        : kras.filter(k => k.type === filterType)

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
        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center space-x-2">
                        <Filter className="w-5 h-5 text-gray-500" />
                        <span className="font-semibold text-gray-700">Filter by Type:</span>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${filterType === 'all'
                                    ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            All ({kras.length})
                        </button>
                        <button
                            onClick={() => setFilterType('daily')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${filterType === 'daily'
                                    ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            📅 Daily ({kras.filter(k => k.type === 'daily').length})
                        </button>
                        <button
                            onClick={() => setFilterType('weekly')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${filterType === 'weekly'
                                    ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            📆 Weekly ({kras.filter(k => k.type === 'weekly').length})
                        </button>
                        <button
                            onClick={() => setFilterType('monthly')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${filterType === 'monthly'
                                    ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            🗓️ Monthly ({kras.filter(k => k.type === 'monthly').length})
                        </button>
                    </div>
                </div>
            </div>

            {/* KRA Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredKras.map((kra) => {
                    const priority = getPriorityBadge(kra.priority)
                    const status = getStatusBadge(kra.status)
                    const typeIcon = getTypeBadge(kra.type)

                    return (
                        <div
                            key={kra.id}
                            className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-primary-100 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary-500 to-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center space-x-2">
                                    <span className="text-2xl">{typeIcon}</span>
                                    <span className="text-xs font-semibold text-gray-500 uppercase">{kra.type}</span>
                                </div>
                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onEdit(kra)}
                                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(kra.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-800 group-hover:text-primary-700 transition-colors line-clamp-1 mb-3">
                                {kra.title}
                            </h3>

                            <p className="text-gray-600 mb-4 line-clamp-2 text-sm h-10">
                                {kra.description}
                            </p>

                            <div className="space-y-3">
                                <div className="flex items-center text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">
                                    <Target className="w-4 h-4 mr-2 text-secondary-500" />
                                    <span className="font-medium text-gray-700 truncate">{kra.target}</span>
                                </div>

                                {/* Priority and Status Badges */}
                                <div className="flex space-x-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${priority.className}`}>
                                        {priority.icon} {kra.priority}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${status.className}`}>
                                        {status.icon} {status.label}
                                    </span>
                                </div>

                                <div className="flex items-center text-xs text-gray-400">
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

            {filteredKras.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-500">No {filterType} goals found.</p>
                </div>
            )}
        </div>
    )
}

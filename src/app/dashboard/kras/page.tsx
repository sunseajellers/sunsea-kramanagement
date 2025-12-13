'use client'

import { useState } from 'react'
import KRAList from '@/components/KRAList'
import KRAForm from '@/components/KRAForm'
import KRACalendar from '@/components/KRACalendar'
import { Plus, Target, List, Calendar } from 'lucide-react'
import { TaskListSkeleton } from '@/components/Skeletons'
import { NoKRAsEmptyState } from '@/components/EmptyState'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import { fetchKRAs } from '@/lib/kraService'
import { getAllTeams } from '@/lib/teamService'

export default function KRAPage() {
    const { user } = useAuth()
    const [showForm, setShowForm] = useState(false)
    const [editKRA, setEditKRA] = useState<null | any>(null)
    const [refreshKey, setRefreshKey] = useState(0)
    const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list')
    const [kras, setKras] = useState<any[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Load KRAs and teams
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
                console.error('Failed to load KRAs or teams', error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [user, refreshKey])

    const handleCreate = () => {
        setEditKRA(null)
        setShowForm(true)
    }

    const handleEdit = (kra: any) => {
        setEditKRA(kra)
        setShowForm(true)
    }

    const handleSaved = () => {
        setShowForm(false)
        setRefreshKey(prev => prev + 1) // Force list refresh
    }

    return (
        <div className="space-y-4">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Target className="w-8 h-8 mr-3 text-primary-600" />
                        Goals & Vibes
                    </h1>
                    <p className="text-gray-500 mt-1">Manage your daily, weekly, and monthly goals</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="btn-primary flex items-center justify-center sm:w-auto w-full"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    ✨ Create New Goal
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex space-x-2">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all ${activeTab === 'list'
                        ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    <List className="w-5 h-5" />
                    <span>List View</span>
                </button>
                <button
                    onClick={() => setActiveTab('calendar')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all ${activeTab === 'calendar'
                        ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    <Calendar className="w-5 h-5" />
                    <span>Calendar View</span>
                </button>
            </div>

            {/* Content based on active tab */}
            {loading ? (
                <>
                    {activeTab === 'list' && <TaskListSkeleton />}
                    {activeTab === 'calendar' && (
                        <div className="bg-white rounded-xl p-8 border border-gray-200 animate-pulse">
                            <div className="h-96 bg-gray-100 rounded-lg" />
                        </div>
                    )}
                </>
            ) : kras.length === 0 ? (
                <div className="bg-white rounded-xl p-12 border border-gray-200">
                    <NoKRAsEmptyState onCreate={handleCreate} />
                </div>
            ) : (
                <>
                    {activeTab === 'list' ? (
                        <KRAList key={refreshKey} onEdit={handleEdit} />
                    ) : (
                        <KRACalendar kras={kras} teams={teams} />
                    )}
                </>
            )}

            {/* Create/Edit Modal */}
            {showForm && (
                <KRAForm
                    initialData={editKRA}
                    onClose={() => setShowForm(false)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    )
}

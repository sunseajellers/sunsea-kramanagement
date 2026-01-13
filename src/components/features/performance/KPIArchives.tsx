'use client'

import { useState, useEffect } from 'react'
import { authenticatedJsonFetch } from '@/lib/apiClient'
import { useAuth } from '@/contexts/AuthContext'
import { Award, Calendar, ChevronRight, FileText, Download, Loader2, Archive, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface KPIArchive {
    id: string
    archivedAt: any
    stats: {
        totalUsers: number
        overallCompletionRate: number
        completedTasks: number
        totalTasks: number
    }
    userSnapshots: any[]
}

export default function KPIArchives() {
    const { user } = useAuth()
    const [archives, setArchives] = useState<KPIArchive[]>([])
    const [loading, setLoading] = useState(true)
    const [archiving, setArchiving] = useState(false)
    const [selectedArchive, setSelectedArchive] = useState<KPIArchive | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        loadArchives()
    }, [])

    const loadArchives = async () => {
        if (!user) return
        setLoading(true)
        try {
            const response = await authenticatedJsonFetch('/api/kpis/archive', {
                headers: {
                    'x-user-id': user.uid
                }
            }) as any
            if (response.success && response.archives) {
                setArchives(response.archives)
            }
        } catch (error) {
            console.error('Failed to load archives:', error)
            toast.error('Failed to load archives')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateArchive = async () => {
        if (!user) return
        setArchiving(true)
        try {
            const response = await authenticatedJsonFetch('/api/kpis/archive', {
                method: 'POST',
                headers: {
                    'x-user-id': user.uid
                }
            }) as any
            if (response.success) {
                toast.success('KPI snapshot created successfully')
                loadArchives()
            }
        } catch (error) {
            toast.error('Failed to create snapshot')
        } finally {
            setArchiving(false)
        }
    }

    const filteredSnapshots = selectedArchive?.userSnapshots.filter(s =>
        s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Accessing Historical Records...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Historical Archives</h2>
                    <p className="text-gray-400 text-xs font-medium">Monthly snapshots of organization-wide KPIs</p>
                </div>
                <Button
                    onClick={handleCreateArchive}
                    disabled={archiving}
                    className="bg-gray-900 hover:bg-black h-10 px-6 rounded-xl font-bold text-sm"
                >
                    {archiving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
                    Capture Snapshot
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Archive List */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Timeline</h3>
                    <div className="space-y-3">
                        {archives.length === 0 ? (
                            <div className="glass-card p-8 text-center bg-gray-50/50">
                                <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Records Found</p>
                            </div>
                        ) : (
                            archives.map(archive => (
                                <button
                                    key={archive.id}
                                    onClick={() => setSelectedArchive(archive)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedArchive?.id === archive.id
                                        ? 'bg-purple-50 border-purple-200 ring-2 ring-purple-100 shadow-sm'
                                        : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className={`w-4 h-4 ${selectedArchive?.id === archive.id ? 'text-purple-600' : 'text-gray-400'}`} />
                                            <span className="text-sm font-black text-gray-900">
                                                {format(new Date(archive.archivedAt), 'MMMM yyyy')}
                                            </span>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 transition-transform ${selectedArchive?.id === archive.id ? 'rotate-90 text-purple-600' : 'text-gray-300'}`} />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Rate</p>
                                            <p className="text-xs font-black text-gray-900">{archive.stats.overallCompletionRate}%</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Tasks</p>
                                            <p className="text-xs font-black text-gray-900">{archive.stats.completedTasks}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Created</p>
                                            <p className="text-xs font-black text-gray-900">{format(new Date(archive.archivedAt), 'dd MMM')}</p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Archive Detail */}
                <div className="lg:col-span-2">
                    {!selectedArchive ? (
                        <div className="glass-card h-full flex flex-col items-center justify-center p-12 text-center bg-gray-50/30 border-dashed border-2 border-gray-100">
                            <Archive className="w-12 h-12 text-gray-100 mb-4" />
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Select Record</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 max-w-[200px]">
                                Pick a snapshot from the timeline to view detailed performance metrics
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="glass-card p-6 bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-none shadow-xl shadow-purple-100">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
                                        <Award className="w-6 h-6" />
                                    </div>
                                    <Button variant="ghost" className="text-white hover:bg-white/10 h-8 text-[10px] font-black uppercase tracking-widest">
                                        <Download className="w-3 h-3 mr-2" />
                                        Export Data
                                    </Button>
                                </div>
                                <h3 className="text-2xl font-black mb-1">
                                    {format(new Date(selectedArchive.archivedAt), 'MMMM yyyy')} Summary
                                </h3>
                                <p className="text-purple-100 text-xs font-bold uppercase tracking-widest opacity-80">System-wide performance snapshot</p>

                                <div className="grid grid-cols-3 gap-6 mt-10">
                                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                                        <p className="text-[9px] font-black text-purple-200 uppercase tracking-widest mb-1">Completion</p>
                                        <p className="text-2xl font-black">{selectedArchive.stats.overallCompletionRate}%</p>
                                    </div>
                                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                                        <p className="text-[9px] font-black text-purple-200 uppercase tracking-widest mb-1">Throughput</p>
                                        <p className="text-2xl font-black">{selectedArchive.stats.completedTasks}</p>
                                    </div>
                                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                                        <p className="text-[9px] font-black text-purple-200 uppercase tracking-widest mb-1">Audience</p>
                                        <p className="text-2xl font-black">{selectedArchive.stats.totalUsers}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-0 flex flex-col overflow-hidden">
                                <div className="p-6 border-b border-gray-50 flex items-center justify-between gap-4">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">Employee Breakdown</h3>
                                    <div className="relative flex-1 max-w-xs">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                                        <Input
                                            placeholder="SEARCH BY NAME"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="h-8 pl-9 bg-gray-50/50 border-none rounded-lg text-[9px] font-black uppercase tracking-widest placeholder:text-gray-200"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                    <table className="data-table">
                                        <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                            <tr>
                                                <th className="px-6 py-4">Employee</th>
                                                <th className="px-6 py-4 text-center">Score</th>
                                                <th className="px-6 py-4 text-center">Tasks</th>
                                                <th className="px-6 py-4 text-center">Efficiency</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredSnapshots.map((snapshot, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-black text-gray-900">{snapshot.userName}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold tracking-tight">{snapshot.email}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-sm font-black text-gray-900">{snapshot.performanceScore}%</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-xs font-bold text-gray-500">{snapshot.completedTasks}/{snapshot.totalTasks}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`badge ${snapshot.completionRate >= 80 ? 'badge-success' :
                                                            snapshot.completionRate >= 60 ? 'badge-warning' : 'badge-danger'
                                                            }`}>
                                                            {snapshot.completionRate}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

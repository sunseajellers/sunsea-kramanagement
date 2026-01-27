'use client'

import { useState, useEffect } from 'react'
import { Search, UserX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmployeeScore {
    id: string
    name: string
    department: string
    score: number
    tasksCompleted: number
    tasksOverdue: number
    status: 'Elite' | 'Master' | 'Professional' | 'Developing'
}

// Simple Score Dashboard
export default function PerformanceAnalytics() {
    const [searchQuery, setSearchQuery] = useState('')
    const [scores, setScores] = useState<EmployeeScore[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchScores = async () => {
            try {
                const response = await fetch('/api/admin/performance')
                const result = await response.json()
                if (result.success) {
                    setScores(result.data)
                }
            } catch (error) {
                console.error('Failed to fetch performance scores:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchScores()
    }, [])

    const filtered = scores.filter(s =>
        (s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.department.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <div className="space-y-10 animate-in">
            <div className="page-header flex items-center justify-between">
                <div>
                    <h2 className="section-title">Performance Vanguard</h2>
                    <p className="section-subtitle">Real-time tactical execution and personnel efficiency audit</p>
                </div>
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        placeholder="Search personnel audit..."
                        className="form-input pl-12 w-full md:w-80 h-14"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-32 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 animate-pulse" />
                    ))
                ) : filtered.length > 0 ? (
                    filtered.map((emp) => (
                        <div key={emp.id} className="glass-panel p-8 flex flex-col xl:flex-row items-center justify-between gap-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group">
                            <div className="flex items-center gap-6 w-full xl:w-auto">
                                <div className="h-20 w-20 rounded-[2rem] bg-slate-50 flex items-center justify-center text-indigo-600 font-black text-2xl border-4 border-white shadow-xl group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:scale-105">
                                    {emp.score}%
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{emp.name}</h4>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{emp.department}</span>
                                        <span className={cn(
                                            "status-badge px-3 py-1 text-[9px]",
                                            emp.status === 'Elite' ? 'status-badge-success' :
                                                emp.status === 'Master' ? 'status-badge-neutral border-indigo-200 text-indigo-600' :
                                                    'status-badge-neutral'
                                        )}>
                                            {emp.status} PROTOCOL
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-12 w-full xl:w-auto justify-between xl:justify-end">
                                <div className="text-center group/stat">
                                    <p className="text-3xl font-black text-slate-900 group-hover/stat:text-indigo-600 transition-colors tracking-tight">{emp.tasksCompleted}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Tactical Ops</p>
                                </div>
                                <div className="text-center group/stat">
                                    <p className={cn("text-3xl font-black tracking-tight transition-colors", emp.tasksOverdue > 0 ? "text-rose-500" : "text-emerald-500")}>
                                        {emp.tasksOverdue}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Constraints</p>
                                </div>
                                <div className="h-14 px-8 flex items-center justify-center rounded-2xl bg-white border-2 border-slate-100 text-slate-900 font-black text-[11px] uppercase tracking-widest group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all shadow-sm">
                                    View Intelligence
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="glass-panel py-20 text-center space-y-4 border-dashed border-4 border-slate-100 bg-slate-50/10">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-white border border-slate-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <UserX className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Personnel Records</h3>
                        <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">Either no personnel matches your search, or no performance data has been synchronized yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

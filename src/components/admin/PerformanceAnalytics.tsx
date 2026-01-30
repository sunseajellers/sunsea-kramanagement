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
        <div className="space-y-12 animate-in">
            <div className="page-header flex items-center justify-between">
                <div>
                    <h2 className="section-title">Performance Scores</h2>
                    <p className="section-subtitle">See how your team is performing based on their completed tasks and goals</p>
                </div>
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-secondary transition-colors" />
                    <input
                        placeholder="Filter by name or group..."
                        className="form-input pl-14 w-full md:w-96 h-14 bg-muted/20 border-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-32 bg-muted/30 rounded-[2.5rem] border border-border/40 animate-pulse" />
                    ))
                ) : filtered.length > 0 ? (
                    filtered.map((emp) => (
                        <div key={emp.id} className="glass-panel p-8 flex flex-col xl:flex-row items-center justify-between gap-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group border-border/40">
                            <div className="flex items-center gap-8 w-full xl:w-auto">
                                <div className="h-24 w-24 rounded-[2.25rem] bg-white flex items-center justify-center text-primary font-black text-3xl border-2 border-border shadow-xl group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all transform group-hover:scale-110 duration-500">
                                    {emp.score}%
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black text-primary uppercase tracking-tight group-hover:text-secondary transition-colors">{emp.name}</h4>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] bg-muted/50 px-4 py-1.5 rounded-xl border border-border/50">{emp.department}</span>
                                        <span className={cn(
                                            "status-badge px-4 py-1.5 text-[9px]",
                                            emp.status === 'Elite' ? 'status-badge-success' :
                                                emp.status === 'Master' ? 'bg-primary/5 text-primary border-primary/10' :
                                                    'status-badge-neutral'
                                        )}>
                                            {emp.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-16 w-full xl:w-auto justify-between xl:justify-end">
                                <div className="text-center group/stat">
                                    <p className="text-4xl font-black text-primary group-hover/stat:text-secondary transition-colors tracking-tight">{emp.tasksCompleted}</p>
                                    <p className="text-[10px] text-muted-foreground/50 font-black uppercase tracking-[0.3em] mt-2">Tasks Done</p>
                                </div>
                                <div className="text-center group/stat">
                                    <p className={cn("text-4xl font-black tracking-tight transition-colors", emp.tasksOverdue > 0 ? "text-destructive" : "text-emerald-600")}>
                                        {emp.tasksOverdue}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground/50 font-black uppercase tracking-[0.3em] mt-2">Overdue</p>
                                </div>
                                <button className="h-16 px-10 flex items-center justify-center rounded-[1.5rem] bg-white border-2 border-border text-primary font-black text-xs uppercase tracking-widest hover:border-secondary hover:text-secondary transition-all shadow-sm active:translate-y-0.5">
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="glass-panel py-32 text-center space-y-6 border-dashed border-border/60 bg-muted/5">
                        <div className="w-24 h-24 rounded-[3.5rem] bg-white border border-border flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <UserX className="w-10 h-10 text-muted-foreground/20" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-primary uppercase tracking-tight">No people found</h3>
                            <p className="text-sm text-muted-foreground/50 font-medium max-w-sm mx-auto">We couldn't find anyone matching your search or there is no performance data yet.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

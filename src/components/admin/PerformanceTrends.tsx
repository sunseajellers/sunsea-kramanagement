'use client'

import { useState, useEffect } from 'react'
import {
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrendData {
    month: string
    score: number
    count: number
}

export default function PerformanceTrends() {
    const [trends, setTrends] = useState<TrendData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTrends = async () => {
            try {
                const response = await fetch('/api/performance/trends')
                const result = await response.json()
                if (result.trends) {
                    setTrends(result.trends)
                }
            } catch (error) {
                console.error('Failed to fetch performance trends:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchTrends()
    }, [])

    if (loading) {
        return (
            <div className="h-64 bg-slate-50 rounded-[3rem] border border-slate-100 animate-pulse" />
        )
    }

    const currentScore = trends[trends.length - 1]?.score || 0
    const prevScore = trends[trends.length - 2]?.score || 0
    const diff = currentScore - prevScore
    const isUp = diff >= 0

    return (
        <div className="glass-panel p-10 hover:shadow-2xl transition-all duration-500 overflow-hidden group/trends animate-in border-border/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h3 className="text-2xl font-black text-primary tracking-tight flex items-center gap-4 uppercase mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                            <Activity className="h-6 w-6" />
                        </div>
                        Growth Trends
                    </h3>
                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] ml-16">Monthly progress overview</p>
                </div>
                <div className={cn(
                    "flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm transition-all",
                    isUp ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-destructive/5 text-destructive border-destructive/10"
                )}>
                    {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {Math.abs(diff)}% CHANGE THIS MONTH
                </div>
            </div>

            <div className="relative">
                <div className="flex items-end gap-5 h-72 group/chart mb-10 px-4">
                    {trends.map((t, i) => (
                        <div key={t.month} className="flex-1 flex flex-col items-center gap-6 h-full justify-end group/bar">
                            <div className="relative w-full flex flex-col items-center">
                                {/* Value Label */}
                                <div className="absolute -top-12 px-5 py-2.5 bg-primary text-white text-[10px] font-black rounded-xl opacity-0 group-hover/bar:opacity-100 transition-all scale-75 group-hover/bar:scale-100 shadow-2xl z-10 uppercase tracking-[0.2em]">
                                    {t.score}%
                                </div>
                                {/* The Bar */}
                                <div
                                    className={cn(
                                        "w-full rounded-[1.25rem] transition-all duration-700 cursor-pointer shadow-sm relative overflow-hidden group-hover/bar:scale-105 group-hover/bar:shadow-2xl group-hover/bar:ring-2 ring-transparent group-hover/bar:ring-border",
                                        i === trends.length - 1
                                            ? "bg-gradient-to-t from-primary to-primary/80"
                                            : "bg-muted/60 group-hover/chart:opacity-40 hover:!opacity-100 hover:bg-muted"
                                    )}
                                    style={{ height: `${t.score}%` }}
                                >
                                    {i === trends.length - 1 && (
                                        <div className="absolute inset-0 bg-white/10 opacity-30 group-hover/bar:opacity-50 transition-opacity" />
                                    )}
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] text-center">
                                {t.month.split(' ')[0]}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="p-8 bg-muted/20 rounded-[3rem] flex items-start gap-8 border-2 border-dashed border-border/60 relative overflow-hidden group-hover/trends:bg-muted/30 transition-colors">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 pointer-events-none group-hover/trends:scale-110 transition-transform duration-1000">
                        <TrendingUp className="w-48 h-48 text-primary" />
                    </div>
                    <div className="p-4 bg-white rounded-2xl shadow-xl shadow-primary/5 border border-border group-hover/trends:rotate-6 transition-transform duration-500">
                        <TrendingUp className="h-7 w-7 text-primary" />
                    </div>
                    <div className="space-y-2 relative">
                        <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] mb-1">Team Insight</p>
                        <p className="text-base font-black text-primary leading-relaxed uppercase tracking-tight">
                            Team performance went {isUp ? 'up' : 'down'} by <span className={cn(isUp ? "text-emerald-600" : "text-destructive")}>{Math.abs(diff)}%</span> compared to last month.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

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
        <div className="glass-panel p-10 hover:shadow-2xl transition-all duration-500 overflow-hidden group/trends animate-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase mb-1">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Activity className="h-6 w-6" />
                        </div>
                        Performance Velocity
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-14">Temporal Efficiency Index</p>
                </div>
                <div className={cn(
                    "flex items-center gap-3 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 shadow-sm transition-all",
                    isUp ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                )}>
                    {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {Math.abs(diff)}% PERFORMANCE DELTA
                </div>
            </div>

            <div className="relative">
                <div className="flex items-end gap-5 h-64 group/chart mb-10">
                    {trends.map((t, i) => (
                        <div key={t.month} className="flex-1 flex flex-col items-center gap-6 h-full justify-end group/bar">
                            <div className="relative w-full flex flex-col items-center">
                                {/* Value Label */}
                                <div className="absolute -top-10 px-4 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl opacity-0 group-hover/bar:opacity-100 transition-all scale-75 group-hover/bar:scale-100 shadow-xl z-10 uppercase tracking-widest">
                                    {t.score}%
                                </div>
                                {/* The Bar */}
                                <div
                                    className={cn(
                                        "w-full rounded-2xl transition-all duration-700 cursor-pointer shadow-sm relative overflow-hidden group-hover/bar:scale-105 group-hover/bar:shadow-indigo-100 group-hover/bar:shadow-2xl",
                                        i === trends.length - 1
                                            ? "bg-gradient-to-t from-indigo-700 to-indigo-500 shadow-indigo-200"
                                            : "bg-slate-100 group-hover/chart:opacity-40 hover:!opacity-100 hover:bg-slate-200"
                                    )}
                                    style={{ height: `${t.score}%` }}
                                >
                                    {i === trends.length - 1 && (
                                        <div className="absolute inset-0 bg-white/10 opacity-50 group-hover/bar:opacity-80 transition-opacity" />
                                    )}
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                                {t.month.split(' ')[0]}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="p-8 bg-slate-50/50 rounded-[2.5rem] flex items-start gap-6 border-2 border-dashed border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] -rotate-12 pointer-events-none group-hover/trends:scale-110 transition-transform duration-700">
                        <TrendingUp className="w-32 h-32" />
                    </div>
                    <div className="p-4 bg-white rounded-[1.25rem] shadow-xl border border-slate-100 group-hover/trends:rotate-3 transition-transform">
                        <TrendingUp className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="space-y-1 relative">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Strategic Intelligence Insight</p>
                        <p className="text-sm font-black text-slate-700 leading-relaxed uppercase tracking-tight">
                            Personnel efficiency {isUp ? 'expanded' : 'contracted'} by <span className={cn(isUp ? "text-emerald-600" : "text-rose-600")}>{Math.abs(diff)}%</span> over the last performance cycle.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

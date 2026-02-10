'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { PerformanceService } from '@/lib/performanceService'
import { cn } from '@/lib/utils'

interface PerformanceData {
    score: number
    taskCount: number
    completedCount: number
}

// Simple Personal Scoreboard
export default function PerformanceScoreboard() {
    const { user } = useAuth()
    const [performance, setPerformance] = useState<PerformanceData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPerformance = async () => {
            if (!user) return
            try {
                const data = await PerformanceService.getPerformanceData(user.uid);
                setPerformance(data);
            } catch (error) {
                console.error('Failed to fetch performance:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchPerformance()
    }, [user])

    if (loading) {
        return (
            <div className="glass-card p-10 text-center animate-pulse">
                <div className="h-4 w-32 bg-slate-200 rounded mx-auto mb-4" />
                <div className="h-10 w-16 bg-slate-200 rounded mx-auto" />
            </div>
        )
    }

    const score = performance?.score || 0
    const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-indigo-600' : 'text-rose-600'

    return (
        <div className="space-y-6">


            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Score */}
                <div className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-2">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Current Score</span>
                    <span className={cn("text-6xl font-black tracking-tighter", scoreColor)}>
                        {score}
                    </span>
                    <span className="text-sm font-medium text-slate-500">
                        {score >= 80 ? 'Excellent Work!' : score >= 60 ? 'Good Progress' : 'Needs Attention'}
                    </span>
                </div>

                {/* Task Stats */}
                <div className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-2">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Efficiency</span>
                    <span className="text-6xl font-black text-slate-900 tracking-tighter">
                        {performance?.completedCount || 0}/{performance?.taskCount || 0}
                    </span>
                    <span className="text-sm font-medium text-slate-500">Completed Works</span>
                </div>

                {/* Simple Insight */}
                <div className="glass-card p-8 flex flex-col justify-center space-y-4">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Feedback</span>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">
                        {score > 80 ? "You are performing exceptionally well. Keep maintaining this quality." :
                            score > 60 ? "You are doing well, but try to complete tasks a bit earlier to improve your score." :
                                "Please focus on clearing your overdue tasks to improve your team standing."}
                    </p>
                </div>
            </div>
        </div>
    )
}

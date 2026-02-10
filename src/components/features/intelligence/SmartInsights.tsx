// src/components/features/intelligence/SmartInsights.tsx
'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, TrendingUp, TrendingDown, Lightbulb, Loader2, Sparkles, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SmartInsightsProps {
    userId: string
}

export default function SmartInsights({ userId }: SmartInsightsProps) {
    const [insights, setInsights] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchInsights() {
            try {
                const response = await fetch(`/api/intelligence/personal?userId=${userId}`)
                if (response.ok) {
                    const result = await response.json()
                    setInsights(result.data)
                }
            } catch (error) {
                console.error('Error fetching insights:', error)
            } finally {
                setLoading(false)
            }
        }
        if (userId) fetchInsights()
    }, [userId])

    if (loading) return (
        <div className="flex items-center justify-center p-8 bg-white/50 rounded-[2.5rem] border border-white/60">
            <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
        </div>
    )

    if (!insights || (!insights.risks.length && !insights.trend && !insights.pattern)) return null

    const hasCriticalRisk = insights.risks.some((r: any) => r.riskScore >= 70)

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50">Smart Hub Insights</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Performance Trend */}
                {insights.trend && (
                    <div className="group relative overflow-hidden bg-white border border-slate-100 p-6 rounded-[2.25rem] shadow-xl shadow-slate-200/20 transition-all hover:shadow-2xl">
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn(
                                "p-3 rounded-2xl bg-opacity-10",
                                insights.trend.trend === 'up' ? "bg-emerald-500 text-emerald-600" : "bg-rose-500 text-rose-600"
                            )}>
                                {insights.trend.trend === 'up' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Weekly Trend</span>
                        </div>
                        <h4 className="text-lg font-black text-primary uppercase leading-tight">
                            {insights.trend.trend === 'up' ? 'Performance is Climbing' : 'Action Needed'}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                            Your overall score is {insights.trend.overallScore}%.
                            {insights.trend.trend === 'up' ? ' Keep up the momentum!' : ' Let\'s focus on backlog today.'}
                        </p>
                    </div>
                )}

                {/* Risk Alerts */}
                {insights.risks.slice(0, 1).map((risk: any) => (
                    <div key={risk.id} className={cn(
                        "group relative overflow-hidden p-6 rounded-[2.25rem] shadow-xl transition-all hover:shadow-2xl border",
                        risk.riskScore >= 70
                            ? "bg-rose-50 border-rose-100 shadow-rose-200/20"
                            : "bg-amber-50 border-amber-100 shadow-amber-200/20"
                    )}>
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn(
                                "p-3 rounded-2xl",
                                risk.riskScore >= 70 ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                            )}>
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                risk.riskScore >= 70 ? "text-rose-400" : "text-amber-400"
                            )}>Risk Detection</span>
                        </div>
                        <h4 className={cn(
                            "text-lg font-black uppercase leading-tight",
                            risk.riskScore >= 70 ? "text-rose-900" : "text-amber-900"
                        )}>
                            High Delay Probability
                        </h4>
                        <p className={cn(
                            "text-[11px] font-medium mt-1",
                            risk.riskScore >= 70 ? "text-rose-600/70" : "text-amber-600/70"
                        )}>
                            "{risk.taskTitle}" is at {risk.riskScore}% risk of missing the deadline.
                        </p>
                    </div>
                ))}

                {/* AI Recommendation */}
                <div className="group relative overflow-hidden bg-primary text-white p-6 rounded-[2.25rem] shadow-xl shadow-primary/20 transition-all hover:shadow-2xl">
                    <div className="flex items-start justify-between mb-4 text-white/50">
                        <div className="p-3 rounded-2xl bg-white/10 text-white">
                            <Lightbulb className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Efficiency Strategy</span>
                    </div>
                    <h4 className="text-lg font-black uppercase leading-tight">Focus Strategy</h4>
                    <p className="text-[11px] text-white/70 font-medium mt-1">
                        {hasCriticalRisk
                            ? "Prioritize resolving blocked tasks first to maintain your current trend."
                            : "Consider linking your current works to Strategy goals for a higher Results score."}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details <ChevronRight className="w-3 h-3" />
                    </div>
                </div>
            </div>
        </div>
    )
}

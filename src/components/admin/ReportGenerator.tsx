'use client'

import { useState } from 'react'
import { FileText, Download, Loader2, ShieldCheck } from 'lucide-react'
import { generatePerformancePDF } from '@/lib/pdfExportService'
import { toast } from 'sonner'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'

export default function ReportGenerator() {
    const { userData } = useAuth()
    const [generating, setGenerating] = useState(false)

    const handleGenerateReport = async () => {
        if (!userData) {
            toast.error('Authentication required for audit engine execution')
            return
        }

        setGenerating(true)
        try {
            // Fetch real performance metrics for the user
            const response = await fetch(`/api/performance/${userData.uid}`)
            const result = await response.json()

            if (!result.success) {
                throw new Error('Failed to fetch performance intelligence')
            }

            const stats = result.data.stats
            const now = new Date()

            const reportData = {
                employeeName: userData.fullName || userData.email || 'Personnel',
                department: userData.department || 'Strategic Unit',
                weekStart: format(startOfWeek(now, { weekStartsOn: 1 }), 'MMM dd, yyyy'),
                weekEnd: format(endOfWeek(now, { weekStartsOn: 1 }), 'MMM dd, yyyy'),
                score: stats.weeklyScore,
                tasksTotal: stats.totalTasks,
                tasksCompleted: stats.completedTasks,
                tasksOverdue: stats.overdueTasks,
                level: stats.weeklyScore >= 90 ? 'Elite' : stats.weeklyScore >= 75 ? 'Master' : 'Professional'
            }

            // Simulate slight delay for audit atmospheric effect
            await new Promise(resolve => setTimeout(resolve, 1000))

            generatePerformancePDF(reportData)
            toast.success('Strategic performance record generated')
        } catch (error) {
            console.error('Report generation failed:', error)
            toast.error('Audit compilation failed. Protocol breach detected.')
        } finally {
            setGenerating(false)
        }
    }
    return (
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/40 group/generator animate-in">
            {/* Background Decor */}
            <div className="absolute -right-16 -bottom-16 opacity-[0.05] group-hover/generator:rotate-12 transition-transform duration-1000">
                <FileText className="h-64 w-64" />
            </div>

            <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black tracking-tight uppercase">Audit Engine</h3>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Operational Compliance</p>
                    </div>
                </div>

                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-md">
                    Execute a comprehensive performance audit for the current operational window.
                    Generates encrypted artifact containing efficiency coefficients and personnel throughput.
                </p>

                <div className="space-y-4 pt-4">
                    <button
                        onClick={handleGenerateReport}
                        disabled={generating}
                        className="w-full bg-white text-slate-900 hover:bg-slate-50 rounded-[1.25rem] font-black text-[11px] uppercase tracking-[0.2em] h-16 flex items-center justify-center gap-4 active:scale-95 transition-all shadow-xl shadow-white/5 border-none cursor-pointer disabled:opacity-50"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Analyzing Tactical Data...
                            </>
                        ) : (
                            <>
                                <Download className="h-5 w-5" />
                                Compile Performance PDF
                            </>
                        )}
                    </button>
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-px bg-white/10 flex-1" />
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                            ISO-27001 SECURED ARTIFACT
                        </p>
                        <div className="h-px bg-white/10 flex-1" />
                    </div>
                </div>
            </div>
        </div>
    )
}

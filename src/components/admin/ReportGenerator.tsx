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
            toast.error('Please log in to generate your report')
            return
        }

        setGenerating(true)
        try {
            // Fetch real performance metrics for the user
            const response = await fetch(`/api/performance/${userData.uid}`)
            const result = await response.json()

            if (!result.success) {
                throw new Error('Could not load your performance data')
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
            toast.success('Your report has been created!')
        } catch (error) {
            console.error('Report generation failed:', error)
            toast.error('Could not create report. Please try again.')
        } finally {
            setGenerating(false)
        }
    }
    return (
        <div className="bg-primary rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-primary/20 group/generator animate-in">
            {/* Background Decor */}
            <div className="absolute -right-16 -bottom-16 opacity-[0.05] group-hover/generator:rotate-12 transition-transform duration-1000">
                <FileText className="h-64 w-64" />
            </div>

            <div className="relative z-10 space-y-10">
                <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                        <ShieldCheck className="h-8 w-8 text-secondary" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black tracking-tight uppercase leading-none">Summary Report</h3>
                        <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.3em] mt-2">Your Performance</p>
                    </div>
                </div>

                <p className="text-white/60 text-base font-medium leading-relaxed max-w-md">
                    Create a clean PDF summary of your work progress and achievements for this week.
                </p>

                <div className="space-y-6 pt-4">
                    <button
                        onClick={handleGenerateReport}
                        disabled={generating}
                        className="w-full bg-white text-primary hover:bg-white/90 rounded-2xl font-black text-xs uppercase tracking-widest h-16 flex items-center justify-center gap-4 active:scale-95 transition-all shadow-2xl shadow-black/10 border-none cursor-pointer disabled:opacity-50"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="h-6 w-6 animate-spin" />
                                Calculating results...
                            </>
                        ) : (
                            <>
                                <Download className="h-6 w-6" />
                                Create My Report
                            </>
                        )}
                    </button>
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-px bg-white/10 flex-1" />
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] whitespace-nowrap">
                            Professional Summary
                        </p>
                        <div className="h-px bg-white/10 flex-1" />
                    </div>
                </div>
            </div>
        </div>
    )
}

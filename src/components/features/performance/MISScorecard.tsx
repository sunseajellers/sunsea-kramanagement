'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, TrendingDown, AlertCircle, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameWeek } from 'date-fns'

interface MISData {
    userId: string
    userName: string
    role: string
    tasksAssigned: number
    tasksCompleted: number
    workNotDoneRate: number
    delayRate: number
    score: number
    savings: number
}

export default function MISScorecard() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<MISData[]>([])
    const [currentDate, setCurrentDate] = useState(new Date())
    const [error, setError] = useState<string | null>(null)

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })

    useEffect(() => {
        fetchMISData()
    }, [currentDate])

    const fetchMISData = async () => {
        setLoading(true)
        setError(null)
        try {
            const token = await user?.getIdToken()
            const dateStr = format(currentDate, 'yyyy-MM-dd')
            const response = await fetch(`/api/reports/mis?date=${dateStr}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                const result = await response.json()
                setData(result.misData || [])
            } else {
                const err = await response.json()
                setError(err.error || 'Failed to fetch MIS data')
            }
        } catch (err) {
            console.error('Error fetching MIS data:', err)
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1))
    const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1))
    const goToCurrent = () => setCurrentDate(new Date())

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-emerald-600'
        if (score >= 75) return 'text-indigo-600'
        if (score >= 60) return 'text-amber-600'
        return 'text-rose-600'
    }

    const getDeductionColor = (rate: number) => {
        if (rate === 0) return 'text-emerald-500'
        if (rate < 10) return 'text-amber-500'
        return 'text-rose-500'
    }

    return (
        <div className="space-y-6">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Consolidated MIS Scorecard</h2>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Weekly Performance Metrics</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                    <button
                        onClick={prevWeek}
                        className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                    >
                        <ChevronLeft className="w-4 h-4 text-slate-600" />
                    </button>
                    <div className="px-4 py-1.5 text-center min-w-[200px]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Target Week</p>
                        <p className="text-sm font-bold text-slate-900">
                            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                        </p>
                    </div>
                    <button
                        onClick={nextWeek}
                        className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                    >
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                    </button>
                    {!isSameWeek(currentDate, new Date(), { weekStartsOn: 1 }) && (
                        <button
                            onClick={goToCurrent}
                            className="ml-2 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-700 transition-all uppercase tracking-widest"
                        >
                            Today
                        </button>
                    )}
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl shadow-slate-200/50">
                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aggregating Global Metrics...</p>
                    </div>
                ) : error ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-4 px-6 text-center">
                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-slate-900 font-bold">Data Fetch Failed</p>
                            <p className="text-slate-500 text-sm mt-1">{error}</p>
                        </div>
                        <button onClick={fetchMISData} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:bg-slate-800">
                            Try Again
                        </button>
                    </div>
                ) : data.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-slate-900 font-bold font-display">No records found</p>
                            <p className="text-slate-500 text-sm mt-1">There are no user metrics for this selected week range.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Person Name</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Tasks</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">% Work Not Done</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">% Delay</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Savings</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Final Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {data.map((row) => (
                                    <tr key={row.userId} className="group hover:bg-slate-50/50 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shadow-inner uppercase tracking-tighter">
                                                    {row.userName.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                                                        {row.userName}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                        {row.role}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full">
                                                <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                                                <span className="text-xs font-bold text-slate-700">{row.tasksCompleted}/{row.tasksAssigned}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <p className={`text-sm font-black ${getDeductionColor(row.workNotDoneRate)}`}>
                                                {row.workNotDoneRate === 0 ? '-' : `${row.workNotDoneRate}%`}
                                            </p>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <p className={`text-sm font-black ${getDeductionColor(row.delayRate)}`}>
                                                {row.delayRate === 0 ? '-' : `${row.delayRate}%`}
                                            </p>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <p className="text-sm font-bold text-emerald-600">
                                                {row.savings > 0 ? `₹${row.savings.toLocaleString()}` : '-'}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-xl font-black ${getScoreColor(row.score)}`}>
                                                    {row.score}%
                                                </span>
                                                <div className="w-16 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${row.score >= 75 ? 'bg-emerald-500' : row.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                                            }`}
                                                        style={{ width: `${row.score}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer Stats */}
            {!loading && data.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Team Efficiency</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black">
                                {Math.round(data.reduce((acc, r) => acc + r.score, 0) / data.length)}%
                            </p>
                            <TrendingDown className="w-4 h-4 text-emerald-400" />
                        </div>
                    </div>
                    {/* ... more mini stats ... */}
                </div>
            )}
        </div>
    )
}

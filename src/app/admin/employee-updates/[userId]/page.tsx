'use client'

import { useState, useEffect, use } from 'react'
import { getTaskUpdatesByUser } from '@/lib/taskUpdateService'
import { TaskUpdate } from '@/types'
import { ArrowLeft, MessageSquare, Calendar, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

interface Props {
    params: Promise<{ userId: string }>
}

export default function EmployeeUpdatesPage({ params }: Props) {
    const { userId } = use(params)
    const [updates, setUpdates] = useState<TaskUpdate[]>([])
    const [employee, setEmployee] = useState<{ fullName: string; email: string } | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [userId])

    const loadData = async () => {
        try {
            setLoading(true)

            // Fetch employee info
            const userDoc = await getDoc(doc(db, 'users', userId))
            if (userDoc.exists()) {
                const data = userDoc.data()
                setEmployee({
                    fullName: data.fullName || data.email,
                    email: data.email
                })
            }

            // Fetch updates for this user
            const updatesData = await getTaskUpdatesByUser(userId)
            setUpdates(updatesData)
        } catch (error) {
            console.error('Failed to load data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Updates...</p>
            </div>
        )
    }

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <Link href="/admin/organization">
                        <Button variant="ghost" className="btn-secondary h-12 w-12 p-0 rounded-2xl">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="section-title">Submission Ledger</h1>
                        <p className="section-subtitle">Tactical reporting history for {employee?.fullName || 'Personnel'}</p>
                    </div>
                </div>
            </div>

            {/* Profile Overview */}
            <div className="glass-panel p-8 bg-slate-900 border-none relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center text-4xl font-black text-white border border-white/10 shadow-2xl backdrop-blur-md">
                        {employee?.fullName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="text-center md:text-left space-y-2">
                        <h2 className="text-3xl font-black text-white tracking-tight">{employee?.fullName || 'Unknown Employee'}</h2>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <p className="text-indigo-300 font-bold text-sm tracking-wide uppercase">{employee?.email}</p>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">{updates.length} Intelligence Submissions</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Updates List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 text-indigo-500" />
                        Engagement History
                    </h3>
                    <span className="text-xs font-bold text-slate-400">{updates.length} Total Records</span>
                </div>

                {updates.length === 0 ? (
                    <div className="glass-panel p-20 text-center flex flex-col items-center">
                        <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6">
                            <MessageSquare className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">No Records Found</h3>
                        <p className="text-slate-500 font-medium max-w-sm">This operative has not submitted any tactical updates to the system yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {updates.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(update => (
                            <div key={update.id} className="glass-panel p-6 hover:translate-x-1 transition-all">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                                    <div className="space-y-1">
                                        <h4 className="text-lg font-black text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                                            {update.taskTitle}
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(update.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    {update.revisionDate && (
                                        <div className="px-4 py-1.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/50 flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Extension Requested</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Report Content</p>
                                        <p className="text-sm font-medium text-slate-700 leading-relaxed">{update.statusUpdate}</p>
                                    </div>

                                    <div className="space-y-4">
                                        {update.revisionDate && (
                                            <div>
                                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Proposed Deadline</p>
                                                <p className="text-sm font-bold text-slate-900">
                                                    {new Date(update.revisionDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                                </p>
                                            </div>
                                        )}

                                        {update.remarks && (
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Internal Remarks</p>
                                                <p className="text-sm text-slate-500 font-medium italic italic-slate-300">"{update.remarks}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

'use client'

import { useState, useEffect, use } from 'react'
import { getTaskUpdatesByUser } from '@/lib/taskUpdateService'
import { TaskUpdate } from '@/types'
import { ArrowLeft, MessageSquare, Calendar, Clock, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
        <div className="page-container">
            <div className="flex-1 overflow-auto space-y-4">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/admin/team-hub">
                            <Button variant="ghost" size="sm" className="h-8">
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back
                            </Button>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                            {employee?.fullName?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">
                                {employee?.fullName || 'Unknown Employee'}
                            </h1>
                            <p className="text-sm text-gray-400 font-medium">
                                {employee?.email} • {updates.length} updates submitted
                            </p>
                        </div>
                    </div>
                </div>

                {/* Updates List */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="border-b bg-gray-50/30 px-6 py-4">
                        <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Task Update History
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {updates.length === 0 ? (
                            <div className="text-center py-12">
                                <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">No updates submitted yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {updates.map(update => (
                                    <div key={update.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 mb-1">
                                                    {update.taskTitle}
                                                </h4>
                                                <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(update.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status Update</p>
                                                <p className="text-gray-700 text-sm">{update.statusUpdate}</p>
                                            </div>

                                            {update.revisionDate && (
                                                <div>
                                                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        Revision Requested
                                                    </p>
                                                    <p className="text-amber-700 text-sm font-medium">
                                                        New date: {new Date(update.revisionDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}

                                            {update.remarks && (
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Remarks</p>
                                                    <p className="text-gray-600 text-sm italic">"{update.remarks}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

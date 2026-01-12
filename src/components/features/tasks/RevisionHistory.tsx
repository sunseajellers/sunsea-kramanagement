// Simple component to display revision history
'use client'

import { useEffect, useState } from 'react'
import { getTaskRevisions } from '@/lib/revisionService'
import { TaskRevision } from '@/types'
import { Clock, CheckCircle, XCircle } from 'lucide-react'

interface RevisionHistoryProps {
    taskId: string
}

export default function RevisionHistory({ taskId }: RevisionHistoryProps) {
    const [revisions, setRevisions] = useState<TaskRevision[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadRevisions()
    }, [taskId])

    const loadRevisions = async () => {
        try {
            const data = await getTaskRevisions(taskId)
            setRevisions(data)
        } catch (error) {
            console.error('Failed to load revisions:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="text-sm text-gray-500">Loading revisions...</div>
    }

    if (revisions.length === 0) {
        return <div className="text-sm text-gray-500">No revision history</div>
    }

    return (
        <div className="space-y-3">
            <h3 className="font-medium">Revision History</h3>
            {revisions.map((revision) => (
                <div key={revision.id} className="border border-gray-200 rounded p-3">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2 mb-2">
                        {revision.status === 'pending' && (
                            <>
                                <Clock className="w-4 h-4 text-yellow-600" />
                                <span className="text-sm font-medium text-yellow-600">Pending</span>
                            </>
                        )}
                        {revision.status === 'resolved' && (
                            <>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-600">Resolved</span>
                            </>
                        )}
                        {revision.status === 'rejected' && (
                            <>
                                <XCircle className="w-4 h-4 text-red-600" />
                                <span className="text-sm font-medium text-red-600">Rejected</span>
                            </>
                        )}
                    </div>

                    {/* Requested Info */}
                    <div className="mb-2">
                        <p className="text-sm text-gray-600">
                            Requested by <span className="font-medium">{revision.requestedByName}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                            {new Date(revision.requestedAt).toLocaleString()}
                        </p>
                    </div>

                    {/* Reason */}
                    <div className="mb-2 p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Reason</p>
                        <p className="text-sm">{revision.reason}</p>
                    </div>

                    {/* Resolution Info */}
                    {revision.status === 'resolved' && revision.resolvedByName && (
                        <div className="mt-2 p-2 bg-green-50 rounded">
                            <p className="text-xs text-gray-600">
                                Resolved by <span className="font-medium">{revision.resolvedByName}</span>
                            </p>
                            {revision.resolutionNotes && (
                                <p className="text-sm mt-1">{revision.resolutionNotes}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                {revision.resolvedAt && new Date(revision.resolvedAt).toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

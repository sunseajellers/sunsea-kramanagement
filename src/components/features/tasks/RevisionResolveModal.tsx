// Simple modal for resolving task revision
'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { resolveTaskRevision } from '@/lib/revisionService'
import toast from 'react-hot-toast'

interface RevisionResolveModalProps {
    revisionId: string
    taskTitle: string
    revisionReason: string
    resolvedBy: string
    resolvedByName: string
    onClose: () => void
    onSuccess: () => void
}

export default function RevisionResolveModal({
    revisionId,
    taskTitle,
    revisionReason,
    resolvedBy,
    resolvedByName,
    onClose,
    onSuccess
}: RevisionResolveModalProps) {
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        setLoading(true)
        try {
            await resolveTaskRevision(revisionId, resolvedBy, resolvedByName, notes)
            toast.success('Revision marked as resolved')
            onSuccess()
            onClose()
        } catch (error) {
            console.error('Failed to resolve revision:', error)
            toast.error('Failed to resolve revision')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Mark Revision as Complete</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Task Info */}
                <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Task</p>
                    <p className="font-medium mb-2">{taskTitle}</p>
                    <p className="text-sm text-gray-600">Revision Requested</p>
                    <p className="text-sm">{revisionReason}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            What did you fix? (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Describe the changes you made..."
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : 'Mark as Complete'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

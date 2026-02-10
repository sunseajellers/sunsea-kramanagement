// Simple modal for requesting task revision
'use client'

import { useState, FormEvent } from 'react'
import { X } from 'lucide-react'
import { requestTaskRevision } from '@/lib/revisionService'
import toast from 'react-hot-toast'

interface RevisionRequestModalProps {
    taskId: string
    taskTitle: string
    requestedBy: string
    requestedByName: string
    onClose: () => void
    onSuccess: () => void
}

export default function RevisionRequestModal({
    taskId,
    taskTitle,
    requestedBy,
    requestedByName,
    onClose,
    onSuccess
}: RevisionRequestModalProps) {
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()

        if (!reason.trim()) {
            toast.error('Please provide a reason for the revision')
            return
        }

        setLoading(true)
        try {
            await requestTaskRevision(taskId, requestedBy, requestedByName, reason)
            toast.success('Revision requested successfully')
            onSuccess()
            onClose()
        } catch (error) {
            console.error('Failed to request revision:', error)
            toast.error('Failed to request revision')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Request Revision</h2>
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
                    <p className="font-medium">{taskTitle}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            Reason for Revision *
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain what needs to be revised..."
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={4}
                            required
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
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Requesting...' : 'Request Revision'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

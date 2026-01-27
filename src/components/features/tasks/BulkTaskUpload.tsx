// Simple CSV upload component for bulk task creation
'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { parseCSV, createBulkTasksFromCSV } from '@/lib/bulkTaskService'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface BulkTaskUploadProps {
    onClose: () => void
    onSuccess: () => void
}

export default function BulkTaskUpload({ onClose, onSuccess }: BulkTaskUploadProps) {
    const { user, userData } = useAuth()
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<any[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        if (!selectedFile.name.endsWith('.csv')) {
            toast.error('Please select a CSV file')
            return
        }

        setFile(selectedFile)

        // Read and preview
        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string
                const parsed = parseCSV(content)
                setPreview(parsed.slice(0, 5)) // Show first 5 rows
            } catch (error: any) {
                toast.error(error.message)
                setFile(null)
            }
        }
        reader.readAsText(selectedFile)
    }

    const handleUpload = async () => {
        if (!file || !user || !userData) return

        setUploading(true)
        try {
            const reader = new FileReader()
            reader.onload = async (event) => {
                try {
                    const content = event.target?.result as string
                    const parsed = parseCSV(content)

                    await createBulkTasksFromCSV(
                        parsed,
                        user.uid,
                        userData.fullName || user.email || 'Unknown',
                        `Bulk Upload - ${file.name}`
                    )

                    toast.success(`Successfully created ${parsed.length} tasks!`)
                    onSuccess()
                    onClose()
                } catch (error: any) {
                    console.error('Upload error:', error)
                    toast.error(error.message || 'Failed to upload tasks')
                } finally {
                    setUploading(false)
                }
            }
            reader.readAsText(file)
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to upload tasks')
            setUploading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Bulk Upload Tasks (CSV)</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Instructions */}
                <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-xl">
                    <p className="text-sm text-primary-900 font-bold mb-2">CSV Format Required:</p>
                    <p className="text-[10px] sm:text-xs text-primary-700 font-mono bg-white p-2 rounded border border-primary-100 overflow-x-auto whitespace-nowrap">
                        title,description,priority,assignedTo,dueDate,progress,teamId,frequency
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-[10px] sm:text-xs text-primary-600">
                        <p>• <b>Priority</b>: low, medium, high, or critical</p>
                        <p>• <b>assignedTo</b>: User ID or email</p>
                        <p>• <b>dueDate</b>: YYYY-MM-DD format</p>
                        <p>• <b>progress</b>: 0 to 100 (optional)</p>
                        <p>• <b>frequency</b>: daily, weekly, fortnightly, monthly, quarterly, yearly, one-time</p>
                    </div>
                </div>

                {/* File Upload */}
                <div className="mb-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 sm:p-10 hover:border-primary-500 hover:bg-primary-50 transition-all duration-300 group"
                    >
                        <Upload className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-400 group-hover:text-primary-500 transition-colors" />
                        <p className="text-sm font-semibold text-gray-700">
                            {file ? file.name : 'Click to select CSV file'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Only .csv files supported</p>
                    </button>
                </div>

                {/* Preview */}
                {preview.length > 0 && (
                    <div className="mb-4">
                        <h3 className="font-bold text-gray-800 mb-2">Preview (first 5 rows):</h3>
                        <div className="border border-gray-100 rounded-xl overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-3 py-3 text-left font-bold text-gray-600">Title</th>
                                        <th className="px-3 py-3 text-left font-bold text-gray-600">Priority</th>
                                        <th className="px-3 py-3 text-left font-bold text-gray-600">Progress</th>
                                        <th className="px-3 py-3 text-left font-bold text-gray-600">Due Date</th>
                                        <th className="px-3 py-3 text-left font-bold text-gray-600">Type</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {preview.map((task, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50">
                                            <td className="px-3 py-3 text-gray-700 font-medium">{task.title}</td>
                                            <td className="px-3 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] bg-gray-100`}>
                                                    {task.priority || 'medium'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-primary-600 font-bold">{task.progress || 0}%</td>
                                            <td className="px-3 py-3 text-gray-500">{task.dueDate || 'N/A'}</td>
                                            <td className="px-3 py-3">
                                                <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                    {task.frequency || 'one-time'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        disabled={uploading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? 'Uploading...' : 'Upload Tasks'}
                    </button>
                </div>
            </div>
        </div>
    )
}

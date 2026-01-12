// Simple template manager component
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { TaskTemplate } from '@/types'
import { getTaskTemplates, createTaskTemplate, deleteTaskTemplate, createTaskFromTemplate } from '@/lib/templateService'
import { Plus, Trash2, Play, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface TemplateManagerProps {
    onClose: () => void
    onTaskCreated: () => void
}

export default function TemplateManager({ onClose, onTaskCreated }: TemplateManagerProps) {
    const { user } = useAuth()
    const [templates, setTemplates] = useState<TaskTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)

    useEffect(() => {
        loadTemplates()
    }, [user])

    const loadTemplates = async () => {
        if (!user) return
        try {
            const data = await getTaskTemplates(user.uid)
            setTemplates(data)
        } catch (error) {
            console.error('Failed to load templates:', error)
            toast.error('Failed to load templates')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (templateId: string) => {
        if (!confirm('Delete this template?')) return
        try {
            await deleteTaskTemplate(templateId)
            toast.success('Template deleted')
            loadTemplates()
        } catch (error) {
            console.error('Failed to delete template:', error)
            toast.error('Failed to delete template')
        }
    }

    const handleUseTemplate = async (templateId: string) => {
        if (!user) return
        try {
            await createTaskFromTemplate(templateId, user.uid)
            toast.success('Task created from template!')
            onTaskCreated()
            onClose()
        } catch (error) {
            console.error('Failed to create task:', error)
            toast.error('Failed to create task')
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Task Templates</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4 inline mr-1" />
                            New Template
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Create Form */}
                {showCreateForm && (
                    <CreateTemplateForm
                        onClose={() => setShowCreateForm(false)}
                        onSuccess={() => {
                            setShowCreateForm(false)
                            loadTemplates()
                        }}
                    />
                )}

                {/* Templates List */}
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading templates...</div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No templates yet. Create your first template!
                    </div>
                ) : (
                    <div className="space-y-3">
                        {templates.map((template) => (
                            <div key={template.id} className="border border-gray-200 rounded p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-medium">{template.name}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                {template.priority}
                                            </span>
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                Used {template.usageCount} times
                                            </span>
                                            {template.isPublic && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                    Public
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleUseTemplate(template.id)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                            title="Use Template"
                                        >
                                            <Play className="w-4 h-4" />
                                        </button>
                                        {template.createdBy === user?.uid && (
                                            <button
                                                onClick={() => handleDelete(template.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
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

// Simple create template form
function CreateTemplateForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const { user } = useAuth()
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        templateTitle: '',
        templateDescription: '',
        priority: 'medium' as any,
        defaultDueDate: 7,
        isPublic: false
    })
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setSaving(true)
        try {
            await createTaskTemplate({
                ...formData,
                createdBy: user.uid
            })
            toast.success('Template created!')
            onSuccess()
        } catch (error) {
            console.error('Failed to create template:', error)
            toast.error('Failed to create template')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="mb-4 p-4 border border-gray-200 rounded bg-gray-50">
            <h3 className="font-medium mb-3">Create New Template</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="block text-sm font-medium mb-1">Template Name *</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Default Task Title *</label>
                    <input
                        type="text"
                        value={formData.templateTitle}
                        onChange={(e) => setFormData({ ...formData, templateTitle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Default Task Description *</label>
                    <textarea
                        value={formData.templateDescription}
                        onChange={(e) => setFormData({ ...formData, templateDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        rows={2}
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Priority</label>
                        <select
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Due in (days)</label>
                        <input
                            type="number"
                            value={formData.defaultDueDate}
                            onChange={(e) => setFormData({ ...formData, defaultDueDate: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                            min="1"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={formData.isPublic}
                        onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                        className="rounded"
                    />
                    <label className="text-sm">Make public (others can use this template)</label>
                </div>
                <div className="flex gap-2 justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? 'Creating...' : 'Create Template'}
                    </button>
                </div>
            </form>
        </div>
    )
}

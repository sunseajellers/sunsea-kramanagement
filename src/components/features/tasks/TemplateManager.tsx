'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { TaskTemplate } from '@/types'
import { getTaskTemplates, createTaskTemplate, deleteTaskTemplate, createTaskFromTemplate } from '@/lib/templateService'
import { Plus, Trash2, Play, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface TemplateManagerProps {
    onClose: () => void
    onTaskCreated: () => void
}

export default function TemplateManager({ onClose, onTaskCreated }: TemplateManagerProps) {
    const { user } = useAuth()
    const [templates, setTemplates] = useState<TaskTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        priority: 'medium' as any,
        kraType: 'operational' as any,
        category: 'general'
    })

    useEffect(() => {
        loadTemplates()
    }, [user])

    const loadTemplates = async () => {
        if (!user) return
        try {
            setLoading(true)
            const data = await getTaskTemplates(user.uid)
            setTemplates(data)
        } catch (error) {
            console.error('Failed to load templates:', error)
            toast.error('Failed to load templates')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!user) return
        try {
            await createTaskTemplate({
                ...formData,
                templateTitle: formData.name,
                templateDescription: formData.description,
                createdBy: user.uid,
                isPublic: false
            })
            toast.success('Template created')
            setShowCreateForm(false)
            setFormData({
                name: '',
                description: '',
                priority: 'medium',
                kraType: 'operational',
                category: 'general'
            })
            loadTemplates()
        } catch (error) {
            toast.error('Failed to create template')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this template?')) return
        try {
            await deleteTaskTemplate(id)
            toast.success('Template deleted')
            loadTemplates()
        } catch (error) {
            toast.error('Failed to delete template')
        }
    }

    const handleUseTemplate = async (id: string) => {
        if (!user) return
        try {
            await createTaskFromTemplate(id, user.uid)
            toast.success('Task created from template!')
            onTaskCreated()
            onClose()
        } catch (error) {
            toast.error('Failed to create task')
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto font-sans">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 leading-none">Task Templates</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Standardized Workflows</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="h-10 px-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                        >
                            <Plus className="w-4 h-4 inline mr-2" />
                            New Template
                        </button>
                        <button onClick={onClose} className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Create Form */}
                {showCreateForm && (
                    <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-4 mb-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Template Name</label>
                            <input
                                required
                                className="h-11 border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none w-full"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
                            <input
                                className="h-11 border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none w-full"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setShowCreateForm(false)} className="h-10 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancel</button>
                            <button type="submit" className="h-10 px-8 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Create Template</button>
                        </div>
                    </form>
                )}

                {/* Templates List */}
                {loading ? (
                    <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary/40" /></div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">No active templates found</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {templates.map((t) => (
                            <div key={t.id} className="glass-panel p-6 group hover:border-primary/20 transition-all border border-slate-100 shadow-none">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">{t.name}</h3>
                                        <p className="text-xs text-slate-500 mt-1">{t.description}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleUseTemplate(t.id)}
                                            className="h-10 px-4 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all"
                                        >
                                            <Play className="w-3.5 h-3.5 inline mr-2" />
                                            Use
                                        </button>
                                        <button
                                            onClick={() => handleDelete(t.id)}
                                            className="h-10 w-10 flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
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

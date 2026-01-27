'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { KRATemplate, getAllKRATemplates, createKRATemplate, toggleKRATemplateStatus, deleteKRATemplate, generateScheduledKRAs } from '@/lib/kraAutomation'
import { Trash2, Play, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'
import { useBulkSelection, executeBulkKRAAction } from '@/lib/bulkUtils'

// Simple OKR Manager
export default function KRAScheduler() {
    const { } = useAuth()
    const [templates, setTemplates] = useState<KRATemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [bulkActionLoading, setBulkActionLoading] = useState(false)
    const bulkSelection = useBulkSelection(templates)

    useEffect(() => { loadTemplates() }, [])

    const loadTemplates = async () => {
        try {
            const data = await getAllKRATemplates()
            setTemplates(data)
        } catch (error) { toast.error('Failed to load goals') } finally { setLoading(false) }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this goal template?')) return
        try { await deleteKRATemplate(id); toast.success('Deleted'); loadTemplates() } catch (e) { toast.error('Failed') }
    }

    const handleToggle = async (id: string, isActive: boolean) => {
        try { await toggleKRATemplateStatus(id, !isActive); toast.success('Updated'); loadTemplates() } catch (e) { toast.error('Failed') }
    }

    const handleManualGenerate = async () => {
        setGenerating(true)
        try {
            const results = await generateScheduledKRAs()
            toast.success(`Created ${results.generated} tasks`)
            loadTemplates()
        } catch (e) { toast.error('Failed') } finally { setGenerating(false) }
    }

    // Bulk actions preserved but simplified
    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${bulkSelection.selectedCount} goals?`)) return
        setBulkActionLoading(true)
        try { await executeBulkKRAAction('delete', bulkSelection.selectedIds); toast.success('Deleted'); bulkSelection.clearSelection(); loadTemplates() } catch (e) { toast.error('Failed') } finally { setBulkActionLoading(false) }
    }

    return (
        <div className="space-y-10 animate-in">
            {/* Page Header */}
            <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h2 className="section-title">Objective Planning</h2>
                    <p className="section-subtitle">Manage recurring organizational goals and key results</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleManualGenerate}
                        disabled={generating}
                        className="h-12 px-6 rounded-2xl border-2 border-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm"
                    >
                        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                        Execute Pulse
                    </Button>
                    <Button
                        onClick={() => setShowCreate(!showCreate)}
                        className={cn(
                            "h-12 px-6 rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-lg",
                            showCreate
                                ? "bg-white text-rose-600 border-2 border-rose-100 hover:bg-rose-50 shadow-rose-100"
                                : "btn-primary"
                        )}
                    >
                        {showCreate ? 'Abort Registry' : 'Instate Objective'}
                    </Button>
                </div>
            </div>

            {/* Create Overlay */}
            {showCreate && (
                <div className="glass-panel p-8 animate-in slide-in-from-top-4 duration-500 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 pointer-events-none">
                        <Play className="w-40 h-40" />
                    </div>
                    <div className="relative">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">Define Recurring Vector</h3>
                        <CreateTemplateForm onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); loadTemplates() }} />
                    </div>
                </div>
            )}

            {/* Objective Ledger */}
            <div className="glass-panel p-0 flex flex-col overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            RECURRING GOAL REPOSITORY
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto scroll-panel">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th className="px-8 py-5 text-left w-16">
                                    <div className="flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            onChange={bulkSelection.toggleAll}
                                            checked={bulkSelection.isAllSelected}
                                            className="w-5 h-5 rounded-md border-slate-200"
                                        />
                                    </div>
                                </th>
                                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Objective Entity</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Frequency</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tactical Priority</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Unit Coverage</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Registry Status</th>
                                <th className="px-8 py-5 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-24 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto mb-4" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Repository...</p>
                                    </td>
                                </tr>
                            ) : templates.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-24 text-center">
                                        <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center border border-slate-100 mx-auto mb-6">
                                            <Play className="w-10 h-10 text-slate-200" />
                                        </div>
                                        <p className="text-lg font-black text-slate-400 uppercase tracking-tight">Repository Empty</p>
                                        <p className="text-sm text-slate-400 font-medium">No recurring objectives registered in system.</p>
                                    </td>
                                </tr>
                            ) : (
                                templates.map(t => (
                                    <tr key={t.id} className={cn(
                                        "group transition-all duration-300 hover:bg-slate-50/50",
                                        bulkSelection.isSelected(t.id) ? 'bg-indigo-50/40' : ''
                                    )}>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={bulkSelection.isSelected(t.id)}
                                                    onChange={() => bulkSelection.toggleSelection(t.id)}
                                                    className="w-5 h-5 rounded-md border-slate-200"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{t.title}</p>
                                                <p className="text-[11px] text-slate-400 font-medium italic line-clamp-1">{t.description || 'No specific parameters provided.'}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={cn(
                                                "status-badge",
                                                (t.priority === 'high' || t.priority === 'critical') ? "status-badge-danger" : "status-badge-neutral"
                                            )}>
                                                {t.priority}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-black text-slate-700 tracking-tighter">{t.assignedTo.length}</span>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">PERSONNEL</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <button
                                                onClick={() => handleToggle(t.id, t.isActive)}
                                                className={cn(
                                                    "status-badge cursor-pointer transition-all hover:scale-105 active:scale-95",
                                                    t.isActive ? "status-badge-success" : "status-badge-neutral text-slate-300"
                                                )}
                                            >
                                                {t.isActive ? 'OPERATIONAL' : 'PAUSED'}
                                            </button>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(t.id)}
                                                className="h-10 w-10 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mass Control Interface */}
            {bulkSelection.selectedCount > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 glass-panel p-1.5 flex gap-1.5 items-center shadow-2xl z-50 animate-in slide-in-from-bottom-12 rounded-[2rem] border-2 border-indigo-100 scale-105">
                    <div className="px-6 flex flex-col justify-center border-r border-slate-100 mr-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Batch Active</span>
                        <span className="text-sm font-black text-indigo-600 tracking-tight">{bulkSelection.selectedCount} OBJECTIVES</span>
                    </div>
                    <Button
                        onClick={handleBulkDelete}
                        disabled={bulkActionLoading}
                        className="h-12 px-8 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                    >
                        {bulkActionLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Purge Registry'}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={bulkSelection.clearSelection}
                        className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                    >
                        Reset
                    </Button>
                </div>
            )}
        </div>
    )
}

function CreateTemplateForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const { user } = useAuth()
    const [formData, setFormData] = useState({
        title: '', description: '', target: '', type: 'daily' as any, priority: 'medium' as any, assignedTo: '', isActive: true
    })
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setSaving(true)
        try {
            await createKRATemplate({
                ...formData,
                assignedTo: formData.assignedTo.split(',').map(s => s.trim()).filter(Boolean),
                createdBy: user.uid
            })
            toast.success('Goal created')
            onSuccess()
        } catch (error) { toast.error('Failed') } finally { setSaving(false) }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Objective Nomenclature</Label>
                    <input
                        placeholder="Ex: Weekly Asset Verification"
                        className="form-input h-14"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Interval Pulse</Label>
                    <div className="relative">
                        <select
                            className="form-input h-14 appearance-none px-5"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="daily">Daily Cycle</option>
                            <option value="weekly">Weekly Pulse</option>
                            <option value="monthly">Monthly Phase</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Directives & Key Results</Label>
                <textarea
                    placeholder="Specify target parameters and deliverables..."
                    className="form-input min-h-[140px] py-4 resize-none"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tactical Priority</Label>
                    <select
                        className="form-input h-14 appearance-none px-5"
                        value={formData.priority}
                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    >
                        <option value="medium">Standard Operational</option>
                        <option value="high">High Velocity</option>
                        <option value="critical">Mission Critical</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Deployment Coverage (Personnel IDs)</Label>
                    <input
                        placeholder="101, 102, 205..."
                        className="form-input h-14 font-mono text-xs"
                        value={formData.assignedTo}
                        onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                    />
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-16 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-50 transition-all">
                    Cancel Registry
                </Button>
                <Button type="submit" disabled={saving} className="flex-1 h-16 btn-primary">
                    {saving ? <Loader2 className="animate-spin h-5 w-5" /> : 'Authorize Objective'}
                </Button>
            </div>
        </form>
    )
}

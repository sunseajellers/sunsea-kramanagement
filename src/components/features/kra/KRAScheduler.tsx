'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { KRATemplate, getAllKRATemplates, createKRATemplate, toggleKRATemplateStatus, deleteKRATemplate, generateScheduledKRAs } from '@/lib/kraAutomation'
import { Trash2, Play, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

import toast from 'react-hot-toast'
import { useBulkSelection, executeBulkKRAAction } from '@/lib/bulkUtils'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

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
        if (!confirm('Delete this goal?')) return
        try { await deleteKRATemplate(id); toast.success('Deleted'); loadTemplates() } catch (e) { toast.error('Failed') }
    }

    const handleToggle = async (id: string, isActive: boolean) => {
        try { await toggleKRATemplateStatus(id, !isActive); toast.success('Updated'); loadTemplates() } catch (e) { toast.error('Failed') }
    }

    const handleManualGenerate = async () => {
        setGenerating(true)
        try {
            const results = await generateScheduledKRAs()
            toast.success(`Created ${results.generated} new tasks`);
            loadTemplates()
        } catch (e) { toast.error('Failed') } finally { setGenerating(false) }
    }

    // Bulk actions
    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${bulkSelection.selectedCount} goals?`)) return
        setBulkActionLoading(true)
        try { await executeBulkKRAAction('delete', bulkSelection.selectedIds); toast.success('Deleted'); bulkSelection.clearSelection(); loadTemplates() } catch (e) { toast.error('Failed') } finally { setBulkActionLoading(false) }
    }

    return (
        <div className="space-y-12 animate-in">
            {/* Page Header */}
            <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                <div>
                    <h2 className="section-title">Auto Tasks</h2>
                    <p className="section-subtitle">Manage tasks that repeat automatically on a schedule</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleManualGenerate}
                        disabled={generating}
                        className="btn-secondary h-14"
                        title="Creates the latest tasks for these goals right now"
                    >
                        {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                        Create Now
                    </button>
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className={cn(
                            "h-14 px-8 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl",
                            showCreate
                                ? "bg-white text-destructive border-2 border-destructive/20 hover:bg-destructive/5 shadow-destructive/10"
                                : "btn-primary"
                        )}
                    >
                        {showCreate ? 'Cancel' : 'Add Auto Task'}
                    </button>
                </div>
            </div>

            {/* Create Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
                            <Play className="w-8 h-8 text-primary shadow-sm" />
                            New Auto Task
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground/60 font-medium">Define a task that repeats automatically on a set schedule</DialogDescription>
                    </DialogHeader>

                    <CreateTemplateForm onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); loadTemplates() }} />
                </DialogContent>
            </Dialog>

            {/* Goal List */}
            <div className="glass-panel p-0 flex flex-col overflow-hidden shadow-2xl shadow-black/[0.02]">
                <div className="px-10 py-8 border-b border-border/40 bg-muted/30">
                    <div className="flex items-center gap-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                            Auto Tasks Running
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto scroll-panel">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-border/20">
                                <th className="px-10 py-6 text-left w-20">
                                    <div className="flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            onChange={bulkSelection.toggleAll}
                                            checked={bulkSelection.isAllSelected}
                                            className="w-5 h-5 rounded-lg border-border text-primary focus:ring-primary/20"
                                        />
                                    </div>
                                </th>
                                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Task Name</th>
                                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Repeats</th>
                                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Priority</th>
                                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Team Size</th>
                                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Status</th>
                                <th className="px-10 py-6 w-24"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-32 text-center">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary/30 mx-auto mb-6" />
                                        <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Loading goals...</p>
                                    </td>
                                </tr>
                            ) : templates.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-32 text-center">
                                        <div className="w-24 h-24 rounded-[3rem] bg-muted/30 flex items-center justify-center mx-auto mb-8">
                                            <Play className="w-10 h-10 text-muted-foreground/20" />
                                        </div>
                                        <p className="text-xl font-black text-primary/40 uppercase tracking-tight">No auto tasks yet</p>
                                        <p className="text-sm text-muted-foreground/50 font-medium">Create your first goal to start automating tasks.</p>
                                    </td>
                                </tr>
                            ) : (
                                templates.map(t => (
                                    <tr key={t.id} className={cn(
                                        "group table-row",
                                        bulkSelection.isSelected(t.id) && 'bg-primary/[0.03]'
                                    )}>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={bulkSelection.isSelected(t.id)}
                                                    onChange={() => bulkSelection.toggleSelection(t.id)}
                                                    className="w-5 h-5 rounded-lg border-border text-primary"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="space-y-1.5">
                                                <p className="text-lg font-black text-primary uppercase tracking-tight group-hover:text-secondary transition-colors">{t.title}</p>
                                                <p className="text-xs text-muted-foreground/70 font-medium italic line-clamp-1">{t.description || 'No description provided.'}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] bg-white px-4 py-2 rounded-xl border border-border shadow-sm">
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <span className={cn(
                                                "status-badge",
                                                (t.priority === 'high' || t.priority === 'critical') ? "status-badge-danger" : "status-badge-neutral"
                                            )}>
                                                {t.priority}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-sm font-black text-primary">{t.assignedTo.length}</span>
                                                <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">People</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <button
                                                onClick={() => handleToggle(t.id, t.isActive)}
                                                className={cn(
                                                    "status-badge cursor-pointer transition-all hover:scale-105 active:scale-95",
                                                    t.isActive ? "status-badge-success" : "status-badge-neutral opacity-40"
                                                )}
                                            >
                                                {t.isActive ? 'ACTIVE' : 'PAUSED'}
                                            </button>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="h-10 w-10 flex items-center justify-center rounded-xl text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
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
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-2xl p-2.5 flex gap-3 items-center shadow-2xl z-50 animate-in slide-in-from-bottom-12 rounded-[2.5rem] border border-border/50 scale-105">
                    <div className="px-8 py-2 flex flex-col justify-center border-r border-border/50 mr-2">
                        <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] mb-1">Selected Items</span>
                        <span className="text-sm font-black text-primary tracking-tight">{bulkSelection.selectedCount} GOALS</span>
                    </div>
                    <button
                        onClick={handleBulkDelete}
                        disabled={bulkActionLoading}
                        className="h-14 px-10 rounded-3xl bg-destructive text-white font-black text-xs uppercase tracking-widest hover:bg-destructive/90 transition-all shadow-xl shadow-destructive/10"
                    >
                        {bulkActionLoading ? <Loader2 className="animate-spin h-6 w-6" /> : 'Delete All'}
                    </button>
                    <button
                        onClick={bulkSelection.clearSelection}
                        className="h-14 px-8 rounded-3xl text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    )
}

function CreateTemplateForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const { user } = useAuth()
    const [formData, setFormData] = useState({
        title: '', description: '', target: '', type: 'weekly' as any, priority: 'medium' as any, assignedTo: '', isActive: true
    })
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!user) return
        setSaving(true)
        try {
            await createKRATemplate({
                ...formData,
                assignedTo: formData.assignedTo.split(',').map(s => s.trim()).filter(Boolean),
                createdBy: user.uid
            })
            toast.success('Goal created successfully')
            onSuccess()
        } catch (error) { toast.error('Check fields and try again') } finally { setSaving(false) }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-10 py-6">
            {/* Primary Details */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-1 bg-primary rounded-full transition-all" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Primary Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="grid gap-2.5">
                        <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Goal Title *</label>
                        <Input
                            placeholder="Ex: Weekly Stock Audit"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="h-10 sm:h-12 bg-slate-50/50 border-slate-100"
                            required
                        />
                    </div>
                    <div className="grid gap-2.5">
                        <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Repeats *</label>
                        <Select
                            value={formData.type}
                            onValueChange={(v) => setFormData({ ...formData, type: v })}
                        >
                            <SelectTrigger className="h-10 sm:h-12 bg-slate-50/50 border-slate-100">
                                <SelectValue placeholder="Select Frequency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Every Day</SelectItem>
                                <SelectItem value="weekly">Every Week</SelectItem>
                                <SelectItem value="monthly">Every Month</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid gap-2.5">
                    <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Description & Instructions</label>
                    <Textarea
                        placeholder="Tell your team exactly what needs to be done..."
                        className="min-h-[120px] py-4 resize-none bg-slate-50/50 border-slate-100"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>
            </div>

            {/* Assignment & Priority */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-1 bg-secondary rounded-full transition-all" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Assignment & Priority</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="grid gap-2.5">
                        <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Priority Level</label>
                        <Select
                            value={formData.priority}
                            onValueChange={(v) => setFormData({ ...formData, priority: v })}
                        >
                            <SelectTrigger className="h-10 sm:h-12 bg-slate-50/50 border-slate-100">
                                <SelectValue placeholder="Select Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="medium">Normal Priority</SelectItem>
                                <SelectItem value="high">High Priority</SelectItem>
                                <SelectItem value="critical">Urgent / Critical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2.5">
                        <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Assign to (User IDs) *</label>
                        <Input
                            placeholder="IDs separated by commas..."
                            value={formData.assignedTo}
                            onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                            className="h-10 sm:h-12 font-mono text-xs bg-slate-50/50 border-slate-100"
                            required
                        />
                    </div>
                </div>
            </div>

            <DialogFooter className="pt-8 border-t border-slate-100">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="h-10 sm:h-12 px-8 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={saving}
                    className="h-10 sm:h-12 px-10 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
                >
                    {saving ? <Loader2 className="animate-spin h-5 w-5 mr-3" /> : <Plus className="w-5 h-5 mr-3" />}
                    Create Task
                </Button>
            </DialogFooter>
        </form>
    )
}

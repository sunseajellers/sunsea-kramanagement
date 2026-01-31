'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Target, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { authenticatedJsonFetch } from '@/lib/apiClient'
import type { OKRTimeframe, KeyResultType } from '@/types'

interface CreateObjectiveModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

interface KeyResultForm {
    title: string
    type: KeyResultType
    targetValue: number
    unit: string
}

export function CreateObjectiveModal({ isOpen, onClose, onSuccess }: CreateObjectiveModalProps) {
    const { user, userData } = useAuth()
    const [loading, setLoading] = useState(false)

    // Objective State
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [timeframe, setTimeframe] = useState<OKRTimeframe>('quarterly')
    const [year, setYear] = useState(new Date().getFullYear())
    const [quarter, setQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1)

    // Key Results State
    const [keyResults, setKeyResults] = useState<KeyResultForm[]>([
        { title: '', type: 'percentage', targetValue: 100, unit: '%' }
    ])

    const handleAddKeyResult = () => {
        setKeyResults([...keyResults, { title: '', type: 'percentage', targetValue: 100, unit: '%' }])
    }

    const handleRemoveKeyResult = (index: number) => {
        setKeyResults(keyResults.filter((_, i) => i !== index))
    }

    const updateKeyResult = (index: number, field: keyof KeyResultForm, value: any) => {
        const updated = [...keyResults]
        updated[index] = { ...updated[index], [field]: value }
        setKeyResults(updated)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !userData) return

        if (!title.trim()) {
            toast.error('Objective title is required')
            return
        }

        if (keyResults.some(kr => !kr.title.trim())) {
            toast.error('All key results must have a title')
            return
        }

        try {
            setLoading(true)

            // 1. Create Objective
            const startDate = new Date(year, (quarter - 1) * 3, 1)
            const endDate = new Date(year, quarter * 3, 0)

            const objectiveResult = await authenticatedJsonFetch('/api/okrs/objectives', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    description,
                    timeframe,
                    year,
                    quarter: timeframe === 'quarterly' ? quarter : undefined,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    ownerId: user.uid,
                    ownerName: userData.fullName,
                    teamId: userData.teamId,
                    status: 'active'
                })
            })

            if (!objectiveResult.success || !objectiveResult.data) throw new Error(objectiveResult.error)

            const objectiveId = objectiveResult.data.id

            // 2. Create Key Results
            const krPromises = keyResults.map(kr =>
                authenticatedJsonFetch('/api/okrs/key-results', {
                    method: 'POST',
                    body: JSON.stringify({
                        objectiveId,
                        title: kr.title,
                        type: kr.type,
                        startValue: 0,
                        targetValue: kr.targetValue,
                        currentValue: 0,
                        unit: kr.unit,
                        status: 'active'
                    })
                })
            )

            await Promise.all(krPromises)

            toast.success('Objective created successfully')
            onSuccess()
            onClose()
            resetForm()
        } catch (error: any) {
            console.error('Error creating objective:', error)
            toast.error(error.message || 'Failed to create objective')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setTitle('')
        setDescription('')
        setTimeframe('quarterly')
        setKeyResults([{ title: '', type: 'percentage', targetValue: 100, unit: '%' }])
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-sm border border-primary/10">
                            <Target className="w-8 h-8" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight">New Strategic Objective</DialogTitle>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Achieve Departmental & Company Growth</p>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-10 py-6">
                    {/* Basic Info Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-1 bg-primary rounded-full" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Objective Definition</h3>
                        </div>

                        <div className="grid gap-6">
                            <div className="grid gap-2.5">
                                <Label htmlFor="title" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Objective Title *</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Achieve Departmental Growth"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="h-12 bg-slate-50/50 border-slate-100"
                                    required
                                />
                            </div>

                            <div className="grid gap-2.5">
                                <Label htmlFor="description" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe the goal of this objective..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="min-h-[100px] py-4 resize-none bg-slate-50/50 border-slate-100"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="grid gap-2.5">
                                    <Label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Timeframe</Label>
                                    <Select
                                        value={timeframe}
                                        onValueChange={(v: OKRTimeframe) => setTimeframe(v)}
                                    >
                                        <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2.5">
                                    <Label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Year</Label>
                                    <Select
                                        value={year.toString()}
                                        onValueChange={(v) => setYear(parseInt(v))}
                                    >
                                        <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[2024, 2025, 2026, 2027].map(y => (
                                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {timeframe === 'quarterly' && (
                                    <div className="grid gap-2.5">
                                        <Label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Quarter</Label>
                                        <Select
                                            value={quarter.toString()}
                                            onValueChange={(v) => setQuarter(parseInt(v))}
                                        >
                                            <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Q1 (Jan-Mar)</SelectItem>
                                                <SelectItem value="2">Q2 (Apr-Jun)</SelectItem>
                                                <SelectItem value="3">Q3 (Jul-Sep)</SelectItem>
                                                <SelectItem value="4">Q4 (Oct-Dec)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Key Results Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-1 bg-secondary rounded-full" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Key Results (Metrics)</h3>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddKeyResult}
                                className="h-8 rounded-xl text-[9px] font-black uppercase tracking-widest bg-secondary/5 border-secondary/20 text-secondary hover:bg-secondary/10"
                            >
                                <Plus className="w-3 h-3 mr-2" />
                                Add Metric
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {keyResults.map((kr, index) => (
                                <div key={index} className="p-6 rounded-3xl border border-slate-100 space-y-6 bg-slate-50/30 relative group">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1 grid gap-2.5">
                                            <Label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Metric Title *</Label>
                                            <Input
                                                placeholder={`Ex: Increase weekly traffic by 20%`}
                                                value={kr.title}
                                                onChange={(e) => updateKeyResult(index, 'title', e.target.value)}
                                                className="h-12 bg-white border-slate-100"
                                                required
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="mt-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                            onClick={() => handleRemoveKeyResult(index)}
                                            disabled={keyResults.length === 1}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        <div className="grid gap-2.5">
                                            <Label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Type</Label>
                                            <Select
                                                value={kr.type}
                                                onValueChange={(v: KeyResultType) => updateKeyResult(index, 'type', v)}
                                            >
                                                <SelectTrigger className="h-12 bg-white border-slate-100">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="percentage">Percentage</SelectItem>
                                                    <SelectItem value="number">Number</SelectItem>
                                                    <SelectItem value="currency">Currency</SelectItem>
                                                    <SelectItem value="boolean">Boolean</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2.5">
                                            <Label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Target</Label>
                                            <Input
                                                type="number"
                                                className="h-12 bg-white border-slate-100"
                                                value={kr.targetValue}
                                                onChange={(e) => updateKeyResult(index, 'targetValue', parseFloat(e.target.value))}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2.5">
                                            <Label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Unit</Label>
                                            <Input
                                                placeholder="%, USD, etc."
                                                className="h-12 bg-white border-slate-100"
                                                value={kr.unit}
                                                onChange={(e) => updateKeyResult(index, 'unit', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="pt-8 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="h-12 px-8 rounded-2xl font-bold uppercase tracking-widest text-[10px]">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="h-12 px-10 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Target className="w-5 h-5 mr-3" />}
                            Create Objective
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

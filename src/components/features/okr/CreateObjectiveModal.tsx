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
import { Plus, Trash2, Target } from 'lucide-react'
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        Create New Objective
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Objective Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Achieve Departmental Growth"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe the goal of this objective..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Timeframe</Label>
                                <Select
                                    value={timeframe}
                                    onValueChange={(v: OKRTimeframe) => setTimeframe(v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="quarterly">Quarterly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Year</Label>
                                <Select
                                    value={year.toString()}
                                    onValueChange={(v) => setYear(parseInt(v))}
                                >
                                    <SelectTrigger>
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
                                <div className="grid gap-2">
                                    <Label>Quarter</Label>
                                    <Select
                                        value={quarter.toString()}
                                        onValueChange={(v) => setQuarter(parseInt(v))}
                                    >
                                        <SelectTrigger>
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

                    {/* Key Results */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Key Results</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddKeyResult}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add KR
                            </Button>
                        </div>

                        {keyResults.map((kr, index) => (
                            <div key={index} className="p-4 border rounded-lg space-y-4 bg-gray-50/50">
                                <div className="flex items-start gap-2">
                                    <div className="flex-1 grid gap-2">
                                        <Input
                                            placeholder={`Key Result ${index + 1}`}
                                            value={kr.title}
                                            onChange={(e) => updateKeyResult(index, 'title', e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleRemoveKeyResult(index)}
                                        disabled={keyResults.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-xs">Type</Label>
                                        <Select
                                            value={kr.type}
                                            onValueChange={(v: KeyResultType) => updateKeyResult(index, 'type', v)}
                                        >
                                            <SelectTrigger className="h-8">
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
                                    <div className="grid gap-2">
                                        <Label className="text-xs">Target</Label>
                                        <Input
                                            type="number"
                                            className="h-8"
                                            value={kr.targetValue}
                                            onChange={(e) => updateKeyResult(index, 'targetValue', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs">Unit</Label>
                                        <Input
                                            placeholder="%, USD, etc."
                                            className="h-8"
                                            value={kr.unit}
                                            onChange={(e) => updateKeyResult(index, 'unit', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Objective'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

'use client'

import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { createTask, updateTask } from '@/lib/taskService'
import { fetchKRAs } from '@/lib/kraService'
import { okrService } from '@/lib/okrService'
import { Task, Priority, TaskStatus, TaskFrequency, Objective, KeyResult } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, ClipboardCheck } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
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

interface Props {
    initialData?: Task | null
    onClose: () => void
    onSaved: () => void
}

interface TaskFormData {
    title: string
    description: string
    status: TaskStatus
    priority: Priority
    kraId?: string
    assignedTo: string
    dueDate: string
    category: string
    frequency: TaskFrequency
    finalTargetDate?: string
    objectiveId?: string
    keyResultId?: string
}

export default function TaskForm({ initialData, onClose, onSaved }: Props) {
    const { user } = useAuth()
    const isEdit = !!initialData
    const [loading, setLoading] = useState(false)
    const [kras, setKras] = useState<any[]>([])
    const [objectives, setObjectives] = useState<Objective[]>([])
    const [keyResults, setKeyResults] = useState<KeyResult[]>([])
    const [users, setUsers] = useState<any[]>([])

    const [form, setForm] = useState<TaskFormData>({
        title: '',
        description: '',
        status: 'assigned',
        priority: 'medium',
        kraId: '',
        assignedTo: '',
        dueDate: '',
        category: 'General',
        frequency: 'one-time',
        finalTargetDate: '',
        objectiveId: '',
        keyResultId: ''
    })

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load all users for the "Assigned To" dropdown (Admin view)
                const { getAllUsers } = await import('@/lib/userService')
                const allUsers = await getAllUsers()
                setUsers(allUsers)

                // Load KRAs
                if (user) {
                    const [kraData, objectiveData] = await Promise.all([
                        fetchKRAs(user.uid),
                        okrService.getObjectives({ status: 'active' })
                    ])
                    setKras(kraData)
                    setObjectives(objectiveData)
                }
            } catch (error) {
                console.error('Failed to load initial data', error)
            }
        }
        loadInitialData()
    }, [user])

    // Load Key Results when objective changes
    useEffect(() => {
        const loadKeyResults = async () => {
            if (form.objectiveId && form.objectiveId !== 'no_objective') {
                try {
                    const krData = await okrService.getKeyResultsByObjective(form.objectiveId)
                    setKeyResults(krData)
                } catch (error) {
                    console.error('Failed to load key results', error)
                }
            } else {
                setKeyResults([])
            }
        }
        loadKeyResults()
    }, [form.objectiveId])

    useEffect(() => {
        if (initialData) {
            const formatDate = (date: any) => {
                if (!date) return ''
                try {
                    const d = date.toDate ? date.toDate() : new Date(date)
                    return d.toISOString().split('T')[0]
                } catch (e) {
                    return ''
                }
            }

            setForm({
                title: initialData.title,
                description: initialData.description,
                status: initialData.status,
                priority: initialData.priority,
                kraId: initialData.kraId || '',
                assignedTo: initialData.assignedTo[0] || '',
                dueDate: formatDate(initialData.dueDate),
                category: initialData.category || 'General',
                frequency: initialData.frequency || 'one-time',
                finalTargetDate: formatDate(initialData.finalTargetDate),
                objectiveId: initialData.objectiveId || '',
                keyResultId: initialData.keyResultId || ''
            })
        }
    }, [initialData])

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value
        setForm({ ...form, [e.target.name]: value })
    }

    const handleSelectChange = (name: keyof TaskFormData, value: string) => {
        setForm({ ...form, [name]: value })
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)

        try {
            const taskData: any = {
                title: form.title,
                description: form.description,
                status: form.status,
                priority: form.priority,
                kraId: (form.kraId && form.kraId !== 'no_kra_selection_value') ? form.kraId : null,
                assignedTo: [form.assignedTo],
                assignedBy: user.uid,
                dueDate: new Date(form.dueDate),
                category: form.category,
                frequency: form.frequency,
                objectiveId: (form.objectiveId && form.objectiveId !== 'no_objective') ? form.objectiveId : null,
                keyResultId: (form.keyResultId && form.keyResultId !== 'no_key_result') ? form.keyResultId : null,
                progress: isEdit ? initialData?.progress : 0,
                updatedAt: new Date()
            }

            if (form.finalTargetDate) {
                taskData.finalTargetDate = new Date(form.finalTargetDate)
            }

            if (isEdit && initialData) {
                await updateTask(initialData.id, taskData)
                // Log activity
                const { logTaskStatusUpdate } = await import('@/lib/activityLogger')
                if (initialData.status !== taskData.status) {
                    await logTaskStatusUpdate(initialData.id, taskData.title, initialData.status, taskData.status)
                }
            } else {
                taskData.createdAt = new Date()
                const taskId = await createTask(taskData)
                // Log activity
                const { logTaskCreated } = await import('@/lib/activityLogger')
                await logTaskCreated(taskId || 'new-task', taskData.title, taskData.assignedTo)
            }
            onSaved()
        } catch (err) {
            console.error(err)
            alert('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-sm border border-primary/10">
                            <ClipboardCheck className="w-8 h-8" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                                {isEdit ? 'Edit Task' : 'Assign New Task'}
                            </DialogTitle>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Fill in the task details below</p>
                        </div>
                    </div>
                </DialogHeader>

                <form id="task-form" onSubmit={handleSubmit} className="space-y-10 py-6">
                    {/* Primary Info */}
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-3 mb-1 sm:mb-2">
                            <div className="h-8 w-1 bg-primary rounded-full transition-all" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Task Details</h3>
                        </div>

                        <div className="grid gap-2.5">
                            <Label htmlFor="title" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Task Title *</Label>
                            <Input
                                id="title"
                                name="title"
                                required
                                placeholder="e.g., Send reports to Team"
                                value={form.title}
                                onChange={handleChange}
                                disabled={loading}
                                className="h-10 sm:h-12 bg-slate-50/50 border-slate-100"
                            />
                        </div>

                        <div className="grid gap-2.5">
                            <Label htmlFor="description" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Mission Description / Instructions *</Label>
                            <Textarea
                                id="description"
                                name="description"
                                required
                                placeholder="Describe what needs to be done..."
                                className="min-h-[120px] sm:min-h-[140px] py-4 resize-none bg-slate-50/50 border-slate-100"
                                value={form.description}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-3 mb-1 sm:mb-2">
                            <div className="h-8 w-1 bg-secondary rounded-full transition-all" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Who and how important?</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="grid gap-2.5">
                                <Label htmlFor="assignedTo" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Assign to</Label>
                                <Select
                                    value={form.assignedTo}
                                    onValueChange={(v) => handleSelectChange('assignedTo', v)}
                                    disabled={loading}
                                >
                                    <SelectTrigger className="h-10 sm:h-12 bg-slate-50/50 border-slate-100">
                                        <SelectValue placeholder="Select Person" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map((u) => (
                                            <SelectItem key={u.id} value={u.id}>
                                                {u.fullName || u.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2.5">
                                <Label htmlFor="category" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Category</Label>
                                <Select
                                    value={form.category}
                                    onValueChange={(v) => handleSelectChange('category', v)}
                                    disabled={loading}
                                >
                                    <SelectTrigger className="h-10 sm:h-12 bg-slate-50/50 border-slate-100">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="General">General</SelectItem>
                                        <SelectItem value="Operational">Operational</SelectItem>
                                        <SelectItem value="Administrative">Administrative</SelectItem>
                                        <SelectItem value="Technical">Technical</SelectItem>
                                        <SelectItem value="Project">Project</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2.5">
                                <Label htmlFor="frequency" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">How often?</Label>
                                <Select
                                    value={form.frequency}
                                    onValueChange={(v) => handleSelectChange('frequency', v as any)}
                                    disabled={loading}
                                >
                                    <SelectTrigger className="h-10 sm:h-12 bg-slate-50/50 border-slate-100">
                                        <SelectValue placeholder="How often?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="one-time">Just once</SelectItem>
                                        <SelectItem value="daily">Every Day</SelectItem>
                                        <SelectItem value="weekly">Every Week</SelectItem>
                                        <SelectItem value="fortnightly">Every 2 Weeks</SelectItem>
                                        <SelectItem value="monthly">Every Month</SelectItem>
                                        <SelectItem value="quarterly">Every 3 Months</SelectItem>
                                        <SelectItem value="yearly">Every Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2.5">
                                <Label htmlFor="priority" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Priority</Label>
                                <Select
                                    value={form.priority}
                                    onValueChange={(v) => handleSelectChange('priority', v as any)}
                                    disabled={loading}
                                >
                                    <SelectTrigger className="h-10 sm:h-12 bg-slate-50/50 border-slate-100">
                                        <SelectValue placeholder="Select Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Normal</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="critical">Very Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-3 mb-1 sm:mb-2">
                            <div className="h-8 w-1 bg-emerald-500 rounded-full transition-all" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">When is it due?</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="grid gap-2.5">
                                <Label htmlFor="dueDate" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Due Date</Label>
                                <Input
                                    id="dueDate"
                                    name="dueDate"
                                    type="date"
                                    required
                                    value={form.dueDate}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="h-10 sm:h-12 bg-slate-50/50 border-slate-100"
                                />
                            </div>

                            <div className="grid gap-2.5">
                                <Label htmlFor="finalTargetDate" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Last Date</Label>
                                <Input
                                    id="finalTargetDate"
                                    name="finalTargetDate"
                                    type="date"
                                    value={form.finalTargetDate}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="h-10 sm:h-12 bg-slate-50/50 border-slate-100"
                                />
                            </div>
                        </div>

                        <div className="grid gap-6">
                            <div className="grid gap-2.5">
                                <Label htmlFor="kraId" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Business Responsibility (KRA)</Label>
                                <Select
                                    value={form.kraId}
                                    onValueChange={(v) => handleSelectChange('kraId', v)}
                                    disabled={loading}
                                >
                                    <SelectTrigger className="h-10 sm:h-12 bg-slate-50/50 border-slate-100 text-left">
                                        <SelectValue placeholder="No KRA Selection" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="no_kra_selection_value">General Duty (No KRA)</SelectItem>
                                        {kras.map((kra) => (
                                            <SelectItem key={kra.id} value={kra.id}>
                                                {kra.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="grid gap-2.5">
                                    <Label htmlFor="objectiveId" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Strategic Goal (Objective)</Label>
                                    <Select
                                        value={form.objectiveId}
                                        onValueChange={(v) => handleSelectChange('objectiveId', v)}
                                        disabled={loading}
                                    >
                                        <SelectTrigger className="h-10 sm:h-12 bg-slate-50/50 border-slate-100 text-left">
                                            <SelectValue placeholder="No Objective Link" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="no_objective">None</SelectItem>
                                            {objectives.map((obj) => (
                                                <SelectItem key={obj.id} value={obj.id}>
                                                    {obj.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2.5">
                                    <Label htmlFor="keyResultId" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Target Result (Key Result)</Label>
                                    <Select
                                        value={form.keyResultId}
                                        onValueChange={(v) => handleSelectChange('keyResultId', v)}
                                        disabled={loading || !form.objectiveId || form.objectiveId === 'no_objective'}
                                    >
                                        <SelectTrigger className="h-10 sm:h-12 bg-slate-50/50 border-slate-100 text-left">
                                            <SelectValue placeholder="No Key Result" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="no_key_result">None</SelectItem>
                                            {keyResults.map((kr) => (
                                                <SelectItem key={kr.id} value={kr.id}>
                                                    {kr.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                <DialogFooter className="pt-8 border-t border-slate-100">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="h-12 px-8 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="task-form"
                        disabled={loading}
                        className="h-10 sm:h-12 px-8 sm:px-10 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
                    >
                        {loading ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <ClipboardCheck className="w-5 h-5 mr-3" />}
                        {isEdit ? 'Save Changes' : 'Assign Task'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

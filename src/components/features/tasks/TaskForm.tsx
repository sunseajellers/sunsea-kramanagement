'use client'

import { useState, useEffect } from 'react'
import { createTask, updateTask } from '@/lib/taskService'
import { fetchKRAs } from '@/lib/kraService'
import { Task, Priority, TaskStatus, TaskFrequency } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
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
}

export default function TaskForm({ initialData, onClose, onSaved }: Props) {
    const { user } = useAuth()
    const isEdit = !!initialData
    const [loading, setLoading] = useState(false)
    const [kras, setKras] = useState<any[]>([])
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
        finalTargetDate: ''
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
                    const kraData = await fetchKRAs(user.uid)
                    setKras(kraData)
                }
            } catch (error) {
                console.error('Failed to load initial data', error)
            }
        }
        loadInitialData()
    }, [user])

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
                finalTargetDate: formatDate(initialData.finalTargetDate)
            })
        }
    }, [initialData])

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value
        setForm({ ...form, [e.target.name]: value })
    }

    const handleSelectChange = (name: keyof TaskFormData, value: string) => {
        setForm({ ...form, [name]: value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
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
                progress: isEdit ? initialData?.progress : 0,
                updatedAt: new Date()
            }

            if (form.finalTargetDate) {
                taskData.finalTargetDate = new Date(form.finalTargetDate)
            }

            if (isEdit && initialData) {
                await updateTask(initialData.id, taskData)
            } else {
                taskData.createdAt = new Date()
                await createTask(taskData)
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
                    <DialogTitle>{isEdit ? 'Edit Task' : 'Assign New Task'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Update the task details below.' : 'Create a new task and assign it to a team member.'}
                    </DialogDescription>
                </DialogHeader>

                <form id="task-form" onSubmit={handleSubmit} className="grid gap-6 py-4">
                    {/* Title */}
                    <div className="grid gap-2">
                        <Label htmlFor="title">Task Title</Label>
                        <Input
                            id="title"
                            name="title"
                            required
                            placeholder="e.g., Complete Q4 sales report"
                            value={form.title}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    {/* Description */}
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            required
                            placeholder="Describe the task details..."
                            className="min-h-[100px]"
                            value={form.description}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Assigned To */}
                        <div className="grid gap-2">
                            <Label htmlFor="assignedTo">Assigned To</Label>
                            <Select
                                value={form.assignedTo}
                                onValueChange={(v) => handleSelectChange('assignedTo', v)}
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select User" />
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

                        {/* Category */}
                        <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={form.category}
                                onValueChange={(v) => handleSelectChange('category', v)}
                                disabled={loading}
                            >
                                <SelectTrigger>
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Frequency */}
                        <div className="grid gap-2">
                            <Label htmlFor="frequency">Frequency</Label>
                            <Select
                                value={form.frequency}
                                onValueChange={(v) => handleSelectChange('frequency', v as any)}
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="one-time">One-time</SelectItem>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="fortnightly">Fortnightly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Priority */}
                        <div className="grid gap-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                                value={form.priority}
                                onValueChange={(v) => handleSelectChange('priority', v as any)}
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Status */}
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={form.status}
                                onValueChange={(v) => handleSelectChange('status', v as any)}
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="not_started">Not Started</SelectItem>
                                    <SelectItem value="assigned">Assigned</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* KRA Link */}
                        <div className="grid gap-2">
                            <Label htmlFor="kraId">Link to KRA (Optional)</Label>
                            <Select
                                value={form.kraId}
                                onValueChange={(v) => handleSelectChange('kraId', v)}
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="No KRA" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="no_kra_selection_value">No KRA</SelectItem>
                                    {kras.map((kra) => (
                                        <SelectItem key={kra.id} value={kra.id}>
                                            {kra.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Due Date */}
                        <div className="grid gap-2">
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input
                                id="dueDate"
                                name="dueDate"
                                type="date"
                                required
                                value={form.dueDate}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        {/* Target Date */}
                        <div className="grid gap-2">
                            <Label htmlFor="finalTargetDate">Target Date</Label>
                            <Input
                                id="finalTargetDate"
                                name="finalTargetDate"
                                type="date"
                                value={form.finalTargetDate}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    </div>
                </form>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="task-form"
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? 'Save Changes' : 'Assign Task'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

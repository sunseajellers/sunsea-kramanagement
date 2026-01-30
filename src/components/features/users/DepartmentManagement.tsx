'use client'

import { useState, useEffect } from 'react'
import {
    Plus,
    MoreHorizontal,
    Search,
    Building2,
    ShieldCheck,
    Trash2,
    Edit2,
    Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog'
import { getAllDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/lib/departmentService'
import { Department } from '@/types'
import { toast } from 'sonner'

export default function DepartmentManagement() {
    const [departments, setDepartments] = useState<Department[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedDept, setSelectedDept] = useState<Department | null>(null)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        headName: '',
        headEmail: ''
    })

    useEffect(() => {
        loadDepartments()
    }, [])

    const loadDepartments = async () => {
        try {
            setLoading(true)
            const data = await getAllDepartments()
            setDepartments(data)
        } catch (error) {
            console.error('Error loading departments:', error)
            toast.error('Failed to load departments')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            await createDepartment(formData)
            toast.success('Department created successfully')
            setIsCreateModalOpen(false)
            setFormData({ name: '', code: '', description: '', headName: '', headEmail: '' })
            loadDepartments()
        } catch (error) {
            toast.error('Failed to create department')
        } finally {
            setSaving(false)
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedDept) return
        setSaving(true)
        try {
            await updateDepartment(selectedDept.id, formData)
            toast.success('Department updated successfully')
            setIsEditModalOpen(false)
            loadDepartments()
        } catch (error) {
            toast.error('Failed to update department')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this department?')) return
        try {
            await deleteDepartment(id)
            toast.success('Department deleted')
            loadDepartments()
        } catch (error) {
            toast.error('Failed to delete department')
        }
    }

    const openEdit = (dept: Department) => {
        setSelectedDept(dept)
        setFormData({
            name: dept.name,
            code: dept.code || '',
            description: dept.description || '',
            headName: (dept as any).headName || '',
            headEmail: (dept as any).headEmail || ''
        })
        setIsEditModalOpen(true)
    }

    const filtered = departments.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.code?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
                <Loader2 className="w-14 h-14 animate-spin text-primary/40" />
                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Loading groups...</p>
            </div>
        )
    }

    return (
        <div className="space-y-12 animate-in pb-20">
            {/* Header */}
            <div className="page-header flex items-center justify-between">
                <div>
                    <h2 className="section-title">Groups Management</h2>
                    <p className="section-subtitle">Manage your departments, group leaders, and internal categories</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({ name: '', code: '', description: '', headName: '', headEmail: '' })
                        setIsCreateModalOpen(true)
                    }}
                    className="btn-primary h-12 px-8"
                >
                    <Plus className="w-5 h-5 mr-3" />
                    Add New Group
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="dashboard-card group">
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] leading-none mb-1">Active Groups</p>
                        <h3 className="text-4xl font-black tracking-tight text-primary transition-colors group-hover:text-secondary">{departments.length}</h3>
                        <div className="flex items-center gap-2 mt-4">
                            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                            <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Live Categories</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel p-8">
                <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                    <Input
                        placeholder="Search groups by name or code..."
                        className="pl-14 h-12"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Group Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filtered.map((dept) => (
                    <div key={dept.id} className="glass-panel p-0 flex flex-col group hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 overflow-hidden border-border/40">
                        <div className="p-10 space-y-8">
                            <div className="flex items-start justify-between">
                                <span className="inline-flex h-7 px-4 items-center rounded-xl bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10 shadow-sm">
                                    {dept.code || 'NO-CODE'}
                                </span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors border border-transparent hover:border-border/50">
                                            <MoreHorizontal className="h-5 w-5 text-muted-foreground/40" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-60 p-3 rounded-[2.5rem] border-none shadow-2xl animate-in fade-in slide-in-from-top-2">
                                        <DropdownMenuLabel className="text-[10px] font-black text-muted-foreground/50 px-5 py-4 uppercase tracking-[0.3em]">Group Options</DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-muted mx-3" />
                                        <DropdownMenuItem onClick={() => openEdit(dept)} className="rounded-2xl text-[11px] font-black uppercase tracking-widest py-4 px-5 flex items-center gap-4 focus:bg-primary/5 focus:text-primary cursor-pointer transition-colors">
                                            <Edit2 className="w-5 h-5 opacity-40" /> Edit Details
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-muted mx-3" />
                                        <DropdownMenuItem onClick={() => handleDelete(dept.id)} className="rounded-2xl text-[11px] font-black uppercase tracking-widest py-4 px-5 flex items-center gap-4 text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer transition-colors">
                                            <Trash2 className="w-5 h-5" /> Delete Group
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-2xl font-black text-primary group-hover:text-secondary transition-colors uppercase tracking-tight">{dept.name}</h3>
                                <p className="text-sm text-muted-foreground/70 font-medium leading-relaxed italic line-clamp-3 min-h-[4.5rem]">
                                    {dept.description || 'No description provided for this group.'}
                                </p>
                            </div>

                            <div className="bg-muted/30 p-5 rounded-[1.75rem] border border-border/40 flex items-center gap-5 group/head">
                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-border shadow-sm group-hover/head:border-secondary/50 transition-colors">
                                    <ShieldCheck className="w-6 h-6 text-secondary" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] leading-none mb-1.5">Group Leader</p>
                                    <p className="text-xs font-black text-primary uppercase tracking-tight line-clamp-1">{(dept as any).headName || 'Not Assigned'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto px-10 py-6 bg-muted/40 border-t border-border/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "flex w-2.5 h-2.5 rounded-full ring-4 ring-white shadow-sm",
                                    dept.isActive !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                                )} />
                                <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">
                                    {dept.isActive !== false ? 'ACTIVE' : 'SUSPENDED'}
                                </span>
                            </div>
                            <button className="h-10 text-[9px] font-black uppercase tracking-[0.3em] text-primary hover:text-secondary transition-colors">
                                VIEW PEOPLE
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Group Overlay */}
            <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(val) => {
                if (!val) {
                    setIsCreateModalOpen(false)
                    setIsEditModalOpen(false)
                }
            }}>
                <DialogContent>
                    <form onSubmit={isCreateModalOpen ? handleCreate : handleUpdate}>
                        <div className="bg-primary px-12 py-16 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
                                <Building2 className="w-48 h-48" />
                            </div>
                            <DialogTitle className="text-4xl font-black tracking-tight uppercase mb-2">
                                {isCreateModalOpen ? 'New Group' : 'Edit Group'}
                            </DialogTitle>
                            <p className="text-secondary text-[10px] font-black uppercase tracking-[0.4em]">Group Settings & Details</p>
                        </div>

                        <div className="p-12 space-y-10 bg-white max-h-[75vh] overflow-y-auto scroll-panel">
                            <div className="grid grid-cols-3 gap-8">
                                <div className="col-span-2 space-y-4">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.3em] ml-2">Group Name *</label>
                                    <Input
                                        required
                                        className="h-12"
                                        placeholder="Ex: Sales Team"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.3em] ml-2">Group Code *</label>
                                    <Input
                                        required
                                        className="h-12 uppercase font-mono tracking-widest text-center"
                                        placeholder="SALES"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.3em] ml-2">Description / Purpose</label>
                                <Textarea
                                    className="min-h-[140px] py-5 resize-none"
                                    placeholder="Briefly describe what this group does..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-8 pt-4">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.3em] ml-2">Group Leader Name</label>
                                        <Input
                                            className="h-12"
                                            placeholder="Ex: Marcus Aurelius"
                                            value={formData.headName}
                                            onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.3em] ml-2">Leader's Email</label>
                                        <Input
                                            type="email"
                                            className="h-12"
                                            placeholder="leader@company.com"
                                            value={formData.headEmail}
                                            onChange={(e) => setFormData({ ...formData, headEmail: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-6 pt-6">
                                <Button type="button" variant="ghost" onClick={() => {
                                    setIsCreateModalOpen(false)
                                    setIsEditModalOpen(false)
                                }} className="flex-1 h-12">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saving} className="flex-1 h-12 font-bold">
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                    {isCreateModalOpen ? 'Create Group' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

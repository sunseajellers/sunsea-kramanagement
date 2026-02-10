'use client'

import { useState, useEffect, FormEvent } from 'react'
import { Plus, MoreHorizontal, Search, Trash2, Edit2, Loader2, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from '@/components/ui/dialog'
import { getAllDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/lib/departmentService'
import { getAllUsers } from '@/lib/userService'
import { Department, User } from '@/types'
import { toast } from 'sonner'

export default function DepartmentManagement() {
    const [departments, setDepartments] = useState<Department[]>([])
    const [, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedDept, setSelectedDept] = useState<Department | null>(null)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        name: ''
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [deptData, userData] = await Promise.all([
                getAllDepartments(),
                getAllUsers()
            ])
            setDepartments(deptData)
            setUsers(userData)
        } catch (error) {
            console.error('Error loading data:', error)
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            await createDepartment(formData)
            toast.success('Department created successfully')
            setIsCreateModalOpen(false)
            setFormData({ name: '' })
            loadData()
        } catch (error) {
            toast.error('Failed to create department')
        } finally {
            setSaving(false)
        }
    }

    const handleUpdate = async (e: FormEvent) => {
        e.preventDefault()
        if (!selectedDept) return
        setSaving(true)
        try {
            await updateDepartment(selectedDept.id, formData)
            toast.success('Department updated successfully')
            setIsEditModalOpen(false)
            setFormData({ name: '' })
            loadData()
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
            loadData()
        } catch (error) {
            toast.error('Failed to delete department')
        }
    }

    const openEdit = (dept: Department) => {
        setSelectedDept(dept)
        setFormData({
            name: dept.name
        })
        setIsEditModalOpen(true)
    }

    const filtered = departments.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
                <Loader2 className="w-14 h-14 animate-spin text-primary/40" />
                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Checking groups...</p>
            </div>
        )
    }

    return (
        <div className="space-y-12 animate-in pb-20">
            {/* Header */}
            <div className="page-header flex items-center justify-between">
                <div>
                    <h2 className="section-title">Team Groups</h2>
                    <p className="section-subtitle">Manage your departments and group leaders</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({ name: '' })
                        setIsCreateModalOpen(true)
                    }}
                    className="btn-primary h-10 sm:h-12 px-6 sm:px-8"
                >
                    <Plus className="w-5 h-5 mr-3" />
                    New Group
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="dashboard-card group">
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] leading-none mb-1">Total Groups</p>
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
                        placeholder="Search groups by name..."
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
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors border border-transparent hover:border-border/50">
                                            <MoreHorizontal className="h-5 w-5 text-muted-foreground/40" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-top-2">
                                        <DropdownMenuLabel className="text-[9px] font-black text-muted-foreground/50 px-4 py-3 uppercase tracking-[0.2em]">Options</DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-muted mx-2" />
                                        <DropdownMenuItem onClick={() => openEdit(dept)} className="rounded-xl text-[10px] font-black uppercase tracking-widest py-3 px-4 flex items-center gap-3 focus:bg-primary/5 focus:text-primary cursor-pointer transition-colors">
                                            <Edit2 className="w-4 h-4 opacity-40" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-muted mx-2" />
                                        <DropdownMenuItem onClick={() => handleDelete(dept.id)} className="rounded-xl text-[10px] font-black uppercase tracking-widest py-3 px-4 flex items-center gap-3 text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer transition-colors">
                                            <Trash2 className="w-4 h-4" /> Delete Group
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-primary group-hover:text-secondary transition-colors uppercase tracking-tight">{dept.name}</h3>
                            </div>
                        </div>

                        <div className="mt-auto px-8 py-4 bg-muted/40 border-t border-border/20 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <span className={cn(
                                    "flex w-2 h-2 rounded-full ring-2 ring-white shadow-sm",
                                    dept.isActive !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                                )} />
                                <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.15em]">
                                    {dept.isActive !== false ? 'ACTIVE' : 'SUSPENDED'}
                                </span>
                            </div>
                            <button className="h-8 text-[8px] font-black uppercase tracking-[0.2em] text-primary hover:text-secondary transition-colors">
                                VIEW PEOPLE
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsCreateModalOpen(false)
                    setIsEditModalOpen(false)
                }
            }}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-sm border border-primary/10">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black uppercase tracking-tight">
                                    {isCreateModalOpen ? 'New Group' : 'Edit Group'}
                                </DialogTitle>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Groups and Leaders</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={isCreateModalOpen ? handleCreate : handleUpdate} className="space-y-10 py-6">
                        {/* Primary Identity Section */}
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex items-center gap-3 mb-1 sm:mb-2">
                                <div className="h-8 w-1 bg-primary rounded-full transition-all" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Group Details</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-5">
                                <div className="grid gap-2">
                                    <Label htmlFor="deptName" className="ml-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Group Name *</Label>
                                    <Input
                                        id="deptName"
                                        required
                                        className="h-10 bg-slate-50/50 border-slate-100"
                                        placeholder="Ex: Strategic Sales Group"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                        </div>

                        <DialogFooter className="pt-6 border-t border-slate-100">
                            <Button type="button" variant="outline" onClick={() => {
                                setIsCreateModalOpen(false)
                                setIsEditModalOpen(false)
                            }} className="h-10 px-6 rounded-xl font-bold uppercase tracking-widest text-[9px]">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving} className="h-10 px-8 rounded-xl font-bold uppercase tracking-widest text-[9px] shadow-lg shadow-primary/10">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (isCreateModalOpen ? <Plus className="w-4 h-4 mr-2" /> : <Building2 className="w-4 h-4 mr-2" />)}
                                {isCreateModalOpen ? 'Create Group' : 'Save Group'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div >
    )
}

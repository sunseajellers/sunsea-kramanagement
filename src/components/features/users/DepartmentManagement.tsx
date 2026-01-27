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
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Accessing Organizational Structure</p>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in">
            {/* Header */}
            <div className="page-header flex items-center justify-between">
                <div>
                    <h2 className="section-title">Organizational Structure</h2>
                    <p className="section-subtitle">Management of departments, divisional heads, and cross-functional teams</p>
                </div>
                <Button
                    onClick={() => {
                        setFormData({ name: '', code: '', description: '', headName: '', headEmail: '' })
                        setIsCreateModalOpen(true)
                    }}
                    className="btn-primary h-12 px-6"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Department
                </Button>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="dashboard-card group">
                    <div className="flex flex-col gap-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Total Divisions</p>
                        <h3 className="text-3xl font-black tracking-tight text-indigo-600 transition-colors group-hover:text-indigo-700">{departments.length}</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Units</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel p-6">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        placeholder="Search departments by name or corporate code..."
                        className="form-input h-12 pl-12"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Department Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.map((dept) => (
                    <div key={dept.id} className="glass-panel p-0 flex flex-col group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                        <div className="p-8 space-y-6">
                            <div className="flex items-start justify-between">
                                <span className="inline-flex h-6 px-2.5 items-center rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
                                    {dept.code || 'NO-CODE'}
                                </span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 transition-colors">
                                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-[2rem] border-none shadow-2xl animate-in fade-in slide-in-from-top-2">
                                        <DropdownMenuLabel className="text-[10px] font-black text-slate-400 px-4 py-3 uppercase tracking-[0.2em]">Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-slate-50 mx-2" />
                                        <DropdownMenuItem onClick={() => openEdit(dept)} className="rounded-xl text-[11px] font-black uppercase tracking-widest py-3 px-4 flex items-center gap-3 focus:bg-indigo-50 focus:text-indigo-600 cursor-pointer">
                                            <Edit2 className="w-4 h-4 opacity-70" /> Edit Unit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-slate-50 mx-2" />
                                        <DropdownMenuItem onClick={() => handleDelete(dept.id)} className="rounded-xl text-[11px] font-black uppercase tracking-widest py-3 px-4 flex items-center gap-3 text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer">
                                            <Trash2 className="w-4 h-4" /> Delete Unit
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{dept.name}</h3>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed italic line-clamp-2 h-10">
                                    {dept.description || 'No description provided for this organizational division.'}
                                </p>
                            </div>

                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4 group/head">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-200 shadow-sm group-hover/head:border-indigo-200 transition-colors">
                                    <ShieldCheck className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Division Head</p>
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-1">{(dept as any).headName || 'Not Assigned'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "flex w-2 h-2 rounded-full ring-4 ring-white shadow-sm",
                                    dept.isActive !== false ? 'bg-emerald-500 shadow-emerald-200 animate-pulse' : 'bg-rose-500 shadow-rose-200'
                                )} />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {dept.isActive !== false ? 'OPERATIONAL' : 'SUSPENDED'}
                                </span>
                            </div>
                            <Button variant="ghost" className="h-9 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 hover:text-indigo-700 hover:bg-white px-4 rounded-xl border border-transparent hover:border-slate-100 transition-all">
                                PERSONNEL
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Management Overlay */}
            <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(val) => {
                if (!val) {
                    setIsCreateModalOpen(false)
                    setIsEditModalOpen(false)
                }
            }}>
                <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden rounded-[3rem] border-none shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <form onSubmit={isCreateModalOpen ? handleCreate : handleUpdate}>
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 px-10 py-12 text-white relative">
                            <div className="absolute top-0 right-0 p-10 opacity-10">
                                <Building2 className="w-32 h-32 rotate-6" />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight uppercase">
                                {isCreateModalOpen ? 'Initialize Unit' : 'Configure Unit'}
                            </h2>
                            <p className="text-indigo-100 text-[10px] font-black mt-1 uppercase tracking-[0.3em] opacity-80">Organizational Entity Parameters</p>
                        </div>

                        <div className="p-10 space-y-8 bg-white max-h-[70vh] overflow-y-auto scroll-panel">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Department Nomenclature *</label>
                                    <input
                                        required
                                        className="form-input h-14"
                                        placeholder="Ex: Strategic Innovation"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Unit Code *</label>
                                    <input
                                        required
                                        className="form-input h-14 uppercase font-mono tracking-widest"
                                        placeholder="ST-IN"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mission Perspective / Purpose</label>
                                <textarea
                                    className="form-input min-h-[120px] py-4 resize-none"
                                    placeholder="Define the scope and strategic objectives..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-6 pt-6 border-t border-slate-50">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Strategic Head</label>
                                        <input
                                            className="form-input h-14"
                                            placeholder="John Shepherd"
                                            value={formData.headName}
                                            onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Head Liaison Email</label>
                                        <input
                                            type="email"
                                            className="form-input h-14"
                                            placeholder="head@organization.com"
                                            value={formData.headEmail}
                                            onChange={(e) => setFormData({ ...formData, headEmail: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="ghost" onClick={() => {
                                    setIsCreateModalOpen(false)
                                    setIsEditModalOpen(false)
                                }} className="flex-1 h-16 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-50 transition-all">
                                    Abort
                                </Button>
                                <Button type="submit" disabled={saving} className="flex-1 h-16 btn-primary">
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (isCreateModalOpen ? 'Authorize Unit' : 'Save Config')}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

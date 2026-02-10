'use client'

import { useState, useEffect } from 'react'
import { ProductiveStaff, getTopPerformers } from '@/lib/staffService'
import { Card } from '@/components/ui/card'
import {
    Users,
    CheckCircle2,
    Plus,
    Search,
    MoreHorizontal,
    ArrowUpRight,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function StaffDirectory() {
    const [performers, setPerformers] = useState<ProductiveStaff[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const perfData = await getTopPerformers()
            setPerformers(perfData)
        } catch (error) {
            toast.error('Failed to load staff data')
        } finally {
            setLoading(false)
        }
    }

    const filtered = performers.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Syncing Personnel...</p>
            </div>
        )
    }

    return (
        <div className="space-y-12 animate-in pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="section-title">Directory</h2>
                    <p className="section-subtitle">Manage your organizational structure and talent</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="btn-primary h-12 px-8 shadow-xl shadow-primary/20">
                    <Plus className="w-5 h-5 mr-3" />
                    Onboard Staff
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="glass-panel p-8 border-none bg-slate-900 text-white relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col gap-2">
                        <Users className="w-4 h-4 text-primary absolute top-8 right-8" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Headcount</p>
                        <h3 className="text-4xl font-black tracking-tighter">{performers.length}</h3>
                        <div className="flex items-center gap-2 mt-4 text-emerald-400">
                            <ArrowUpRight className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">+2 this month</span>
                        </div>
                    </div>
                </Card>

                <Card className="glass-panel p-8 border-none bg-white shadow-xl shadow-slate-200/50">
                    <div className="flex flex-col gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary absolute top-8 right-8" />
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Completed Actions</p>
                        <h3 className="text-4xl font-black tracking-tighter text-slate-900">24</h3>
                        <div className="flex items-center gap-2 mt-4 text-slate-400">
                            <span className="text-[10px] font-black uppercase tracking-widest">Operational Velocity</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <div className="glass-panel p-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                    <Input
                        placeholder="Filter by name, department or role..."
                        className="pl-12 h-14 text-lg border-none bg-slate-50/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.map((person) => (
                    <Card key={person.id} className="glass-panel p-0 overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-none">
                        <div className="p-8 space-y-6">
                            <div className="flex items-start justify-between">
                                <div className="w-16 h-16 rounded-2xl bg-primary shadow-2xl shadow-primary/20 flex items-center justify-center text-white font-black text-2xl uppercase">
                                    {person.name.substring(0, 2)}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground/40">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl">
                                        <DropdownMenuItem onClick={() => setIsEditModalOpen(true)} className="rounded-xl text-[10px] font-black uppercase tracking-widest py-3 px-4 flex items-center gap-3">
                                            View Profile
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div>
                                <h3 className="text-xl font-black text-slate-900 truncate">{person.name}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Senior Associate</p>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                        <span>Contribution</span>
                                        <span className="text-primary">{person.taskCount}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min(person.taskCount * 10, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Available</span>
                            </div>
                            <Button variant="ghost" className="h-8 text-[9px] font-black uppercase tracking-widest text-primary hover:text-secondary">
                                Message
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={() => {
                setIsCreateModalOpen(false)
                setIsEditModalOpen(false)
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isCreateModalOpen ? 'Onboard Staff' : 'Edit Staff'}</DialogTitle>
                    </DialogHeader>
                    <div className="py-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                        Personnel data management interface
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

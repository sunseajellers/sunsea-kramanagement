'use client'

import { useState, useEffect } from 'react'
import { Customer, getAllCustomers, deleteCustomer } from '@/lib/crmService'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Search, UserPlus, MoreHorizontal, Loader2, Mail, Phone, Building2 } from 'lucide-react'
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
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function CustomerDirectory() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    useEffect(() => {
        loadCustomers()
    }, [])

    const loadCustomers = async () => {
        try {
            setLoading(true)
            const data = await getAllCustomers()
            setCustomers(data)
        } catch (error) {
            toast.error('Failed to load customers')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this customer?')) return
        try {
            await deleteCustomer(id)
            toast.success('Customer deleted')
            loadCustomers()
        } catch (error) {
            toast.error('Failed to delete customer')
        }
    }

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Loading Directory...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="section-title">Client Portfolio</h2>
                    <p className="section-subtitle">Manage your key accounts and corporate relationships</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="btn-primary h-12 px-8 shadow-xl shadow-primary/20">
                    <UserPlus className="w-5 h-5 mr-3" />
                    Add Client
                </Button>
            </div>

            <div className="glass-panel p-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                    <Input
                        placeholder="Search by name, company or email..."
                        className="pl-12 h-14 text-lg border-none bg-slate-50/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.map((customer) => (
                    <Card key={customer.id} className="glass-panel p-0 overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-none">
                        <div className="p-8 space-y-6">
                            <div className="flex items-start justify-between">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                                    <User className="w-8 h-8" />
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground/40">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl">
                                        <DropdownMenuItem onClick={() => setIsEditModalOpen(true)} className="rounded-xl text-[10px] font-black uppercase tracking-widest py-3 px-4">
                                            Edit Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(customer.id)} className="rounded-xl text-[10px] font-black uppercase tracking-widest py-3 px-4 text-destructive">
                                            Delete Client
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div>
                                <h3 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors truncate">{customer.name}</h3>
                                <div className="flex items-center gap-2 mt-1.5 text-slate-400">
                                    <Building2 className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{customer.company}</span>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <Mail className="w-4 h-4 text-primary/40" />
                                    <a href={`mailto:${customer.email}`} className="text-[11px] font-bold hover:text-primary transition-colors underline decoration-primary/20 underline-offset-4">{customer.email}</a>
                                </div>
                                {customer.phone && (
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <Phone className="w-4 h-4 text-primary/40" />
                                        <span className="text-[11px] font-bold">{customer.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-8 py-4 bg-muted/30 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{customer.type}</span>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsCreateModalOpen(false)
                    setIsEditModalOpen(false)
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isCreateModalOpen ? 'Add Client' : 'Edit Client'}</DialogTitle>
                    </DialogHeader>
                    {/* Form content */}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsCreateModalOpen(false)
                            setIsEditModalOpen(false)
                        }}>Cancel</Button>
                        <Button>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

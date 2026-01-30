'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import toast from 'react-hot-toast'
import { UserCheck, Search, Download, MoreHorizontal, UserPlus, Eye, EyeOff, Shield, Activity, Loader2, Users, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getAllUsers, createUser, updateUser, deleteUser } from '@/lib/userService'
import { useBulkSelection, executeBulkUserAction } from '@/lib/bulkUtils'
import BulkActionBar from '@/components/features/bulk/BulkActionBar'
import { cn } from '@/lib/utils'
import { getAllDepartments } from '@/lib/departmentService'
import { Department, EmployeeType as EmployeeTypeEnum } from '@/types'

const ITEMS_PER_PAGE = 8;

export default function UserManagement() {
    const { user } = useAuth()
    const [users, setUsers] = useState<User[]>([])
    const [departments, setDepartments] = useState<Department[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [bulkActionLoading, setBulkActionLoading] = useState(false)

    // Create user dialog state
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)
    const [newUserEmail, setNewUserEmail] = useState('')
    const [newUserPassword, setNewUserPassword] = useState('')
    const [newUserName, setNewUserName] = useState('')
    const [newEmployeeId, setNewEmployeeId] = useState('')
    const [newDepartment, setNewDepartment] = useState('')
    const [newPosition, setNewPosition] = useState('')
    const [newEmployeeType, setNewEmployeeType] = useState<EmployeeTypeEnum>('full-time')
    const [showPassword, setShowPassword] = useState(false)

    // Filtering and search state
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<string>('name')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [userList, deptList] = await Promise.all([
                getAllUsers(),
                getAllDepartments()
            ])
            setUsers(userList)
            setDepartments(deptList)
        } catch (error) {
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const loadUsers = async () => {
        try {
            const userList = await getAllUsers()
            setUsers(userList)
        } catch (error) {
            toast.error('Failed to load users')
        }
    }

    // Filtered and sorted users
    const filteredUsers = useMemo(() => {
        let filtered = users.filter(user => {
            const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' && user.isActive !== false) ||
                (statusFilter === 'inactive' && user.isActive === false)

            return matchesSearch && matchesStatus
        })

        // Sort users
        filtered.sort((a, b) => {
            let aValue: any, bValue: any

            switch (sortBy) {
                case 'name':
                    aValue = a.fullName.toLowerCase()
                    bValue = b.fullName.toLowerCase()
                    break
                case 'email':
                    aValue = a.email.toLowerCase()
                    bValue = b.email.toLowerCase()
                    break
                case 'joined':
                    aValue = a.createdAt.getTime()
                    bValue = b.createdAt.getTime()
                    break
                default:
                    return 0
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [users, searchTerm, statusFilter, sortBy, sortOrder])

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredUsers.slice(start, start + ITEMS_PER_PAGE)
    }, [filteredUsers, currentPage])

    // Simplified selection
    const bulkSelection = useBulkSelection(filteredUsers)

    const handleBulkDeactivate = async (active: boolean) => {
        setBulkActionLoading(true)
        try {
            const result = await executeBulkUserAction('toggleActive', bulkSelection.selectedIds)
            toast.success(`${active ? 'Activated' : 'Suspended'} ${result.success} users`)
            bulkSelection.clearSelection()
            loadUsers()
        } catch (error) {
            toast.error('Bulk update failed')
        } finally {
            setBulkActionLoading(false)
        }
    }

    const handleBulkRoleChange = async (isAdmin: boolean) => {
        setBulkActionLoading(true)
        try {
            const result = await executeBulkUserAction('updateRole', bulkSelection.selectedIds, { isAdmin })
            toast.success(`Updated ${result.success} users`)
            bulkSelection.clearSelection()
            loadUsers()
        } catch (error) {
            toast.error('Bulk role update failed')
        } finally {
            setBulkActionLoading(false)
        }
    }

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) {
            return
        }

        try {
            await deleteUser(userId)
            toast.success(`User "${userName}" deleted successfully`)
            loadUsers()
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete user')
        }
    }

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${bulkSelection.selectedCount} users? This action cannot be undone.`)) {
            return
        }

        setBulkActionLoading(true)
        try {
            const result = await executeBulkUserAction('delete', bulkSelection.selectedIds)
            toast.success(`Deleted ${result.success} users`)
            bulkSelection.clearSelection()
            loadUsers()
        } catch (error) {
            toast.error('Bulk delete failed')
        } finally {
            setBulkActionLoading(false)
        }
    }

    const exportUsers = () => {
        const csvContent = [
            ['Name', 'Email', 'Role', 'Status', 'Joined', 'Last Login'].join(','),
            ...filteredUsers.map(user => [
                `"${user.fullName}"`,
                `"${user.email}"`,
                'Employee',
                user.isActive !== false ? 'Active' : 'Inactive',
                user.createdAt.toISOString().split('T')[0],
                user.lastLogin ? user.lastLogin.toISOString().split('T')[0] : 'Never'
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'users.csv'
        a.click()
        window.URL.revokeObjectURL(url)
    }

    const handleCreateUser = async () => {
        if (!user) {
            toast.error('You must be logged in to create users')
            return
        }

        if (!newUserEmail || !newUserPassword || !newUserName || !newEmployeeId) {
            toast.error('Please fill in all required fields (Name, Email, Password, Employee ID)')
            return
        }

        if (newUserPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        setCreateLoading(true)

        try {
            const idToken = await user.getIdToken()
            await createUser(
                newUserEmail,
                newUserPassword,
                newUserName,
                {
                    employeeId: newEmployeeId,
                    department: newDepartment,
                    position: newPosition,
                    employeeType: newEmployeeType
                },
                [],
                idToken
            )

            toast.success(`User ${newUserName} created successfully!`)
            setCreateDialogOpen(false)
            setNewUserEmail('')
            setNewUserPassword('')
            setNewUserName('')
            setNewEmployeeId('')
            setNewDepartment('')
            setNewPosition('')
            loadUsers()
        } catch (error: any) {
            toast.error(error.message || 'Failed to create user')
        } finally {
            setCreateLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="page-container flex-center">
                <div className="flex flex-col items-center gap-6">
                    <Loader2 className="w-12 h-12 animate-spin text-primary/40" />
                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Loading people list...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-12 animate-in">
            {/* Header */}
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="section-title">People Management</h1>
                    <p className="section-subtitle">Manage everyone in your team and their access levels</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={exportUsers}
                        className="btn-secondary h-12 w-12 p-0 flex items-center justify-center rounded-xl"
                        title="Download as CSV"
                    >
                        <Download className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setCreateDialogOpen(true)}
                        className="btn-primary h-12 px-8"
                    >
                        <UserPlus className="h-5 w-5 mr-3" />
                        Add New Person
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel p-8 flex items-center gap-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <Input
                        placeholder="Search by name or email address..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="pl-10 h-12 bg-white/50"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-[180px]">
                        <Select
                            value={statusFilter}
                            onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
                        >
                            <SelectTrigger className="h-12 bg-white/50 border-input">
                                <SelectValue placeholder="Any Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Any Status</SelectItem>
                                <SelectItem value="active">Active Now</SelectItem>
                                <SelectItem value="inactive">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-[180px]">
                        <Select
                            value={sortBy}
                            onValueChange={(v) => setSortBy(v)}
                        >
                            <SelectTrigger className="h-12 bg-white/50 border-input">
                                <SelectValue placeholder="Sort by Name" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">Sort by Name</SelectItem>
                                <SelectItem value="email">Sort by Email</SelectItem>
                                <SelectItem value="joined">Sort by Date</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="h-12 w-12 rounded-2xl bg-muted/50 border border-border/50 hover:bg-muted text-primary transition-all flex items-center justify-center font-bold"
                    >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                </div>
            </div>

            {/* People List */}
            <div className="glass-panel p-0 flex flex-col overflow-hidden shadow-2xl shadow-black/[0.02]">
                <div className="flex items-center justify-between px-10 py-8 border-b border-border/40 bg-muted/30">
                    <div className="flex items-center gap-4">
                        <Users className="w-6 h-6 text-primary/60" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                            {filteredUsers.length} Team Members
                        </span>
                    </div>
                    <div className="flex items-center gap-5 bg-white px-6 py-3 rounded-2xl border border-border/50 shadow-sm">
                        <span className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-widest">Select All</span>
                        <Checkbox
                            checked={bulkSelection.isAllSelected}
                            onCheckedChange={() => bulkSelection.toggleAll()}
                            className="w-5 h-5 rounded-lg border-border"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto scroll-panel">
                    <table className="w-full border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="border-b border-border/20">
                                <th className="px-10 py-6 text-left w-20"></th>
                                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Full Name</th>
                                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Employee ID</th>
                                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Status</th>
                                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Department</th>
                                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Joined On</th>
                                <th className="px-10 py-6 w-24"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {paginatedUsers.length > 0 ? (
                                paginatedUsers.map((u) => (
                                    <tr key={u.id} className={cn(
                                        "group table-row",
                                        bulkSelection.isSelected(u.id) && 'bg-primary/[0.03]'
                                    )}>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center justify-center">
                                                <Checkbox
                                                    checked={bulkSelection.isSelected(u.id)}
                                                    onCheckedChange={() => bulkSelection.toggleSelection(u.id)}
                                                    className="w-5 h-5 rounded-lg border-border"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-3xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-xl shadow-primary/20 ring-4 ring-white">
                                                    {u.fullName.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-lg font-black text-primary uppercase tracking-tight group-hover:text-secondary transition-colors">{u.fullName}</p>
                                                    <p className="text-xs text-muted-foreground/60 font-medium">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <span className="text-[11px] font-black text-primary font-mono tracking-widest bg-muted px-3 py-1.5 rounded-xl border border-border shadow-sm">
                                                {(u as any).employeeId || 'NX-000'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <span className={cn(
                                                "status-badge",
                                                u.isActive !== false ? "status-badge-success" : "status-badge-danger"
                                            )}>
                                                {u.isActive !== false ? 'ACTIVE' : 'SUSPENDED'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
                                                {(u as any).department || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <span className="text-xs text-muted-foreground font-bold uppercase">
                                                {u.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="h-12 w-12 flex items-center justify-center rounded-2xl opacity-0 group-hover:opacity-100 transition-all border border-border/50 hover:bg-muted">
                                                        <MoreHorizontal className="h-6 w-6 text-muted-foreground" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-64 p-3 rounded-[2.5rem] border-none shadow-2xl animate-in fade-in slide-in-from-top-2">
                                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 px-5 py-4">Manage Access</DropdownMenuLabel>
                                                    <DropdownMenuSeparator className="bg-muted mx-3" />
                                                    <DropdownMenuItem
                                                        onClick={() => updateUser(u.id, { isAdmin: !u.isAdmin })}
                                                        className="rounded-2xl text-[11px] font-black uppercase tracking-widest py-4 px-5 flex items-center gap-4 focus:bg-primary/5 focus:text-primary cursor-pointer transition-colors"
                                                    >
                                                        <Shield className="h-5 w-5 opacity-40" />
                                                        {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => updateUser(u.id, { isActive: u.isActive === false })}
                                                        className="rounded-2xl text-[11px] font-black uppercase tracking-widest py-4 px-5 flex items-center gap-4 focus:bg-muted cursor-pointer transition-colors"
                                                    >
                                                        <Activity className="h-5 w-5 opacity-40" />
                                                        {u.isActive === false ? 'Unsuspend' : 'Suspend Account'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-muted mx-3" />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteUser(u.id, u.fullName)}
                                                        className="rounded-2xl text-[11px] font-black uppercase tracking-widest py-4 px-5 flex items-center gap-4 text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer transition-colors"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                        Delete Permanently
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-24 h-24 rounded-[3.5rem] bg-muted flex items-center justify-center">
                                                <Users className="w-10 h-10 text-muted-foreground/20" />
                                            </div>
                                            <p className="text-xl font-black text-primary/30 uppercase tracking-tight">No people found</p>
                                            <p className="text-sm text-muted-foreground/40 font-medium">Try a different search or add a new person</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-10 py-8 border-t border-border/20 bg-muted/20">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-white border border-transparent hover:border-border disabled:opacity-20 transition-all font-bold"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const page = i + 1
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-12 w-12 rounded-2xl text-xs font-black transition-all",
                                            currentPage === page
                                                ? "bg-primary text-white shadow-xl shadow-primary/20"
                                                : "text-muted-foreground hover:bg-white border border-transparent hover:border-border"
                                        )}
                                    >
                                        {page}
                                    </button>
                                )
                            })}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-white border border-transparent hover:border-border disabled:opacity-20 transition-all font-bold"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Actions */}
            <BulkActionBar
                selectedCount={bulkSelection.selectedCount}
                onClear={bulkSelection.clearSelection}
                actions={[
                    {
                        label: 'Suspend Selected',
                        icon: EyeOff,
                        onClick: () => handleBulkDeactivate(false),
                        disabled: bulkActionLoading
                    },
                    {
                        label: 'Make Admin',
                        icon: Shield,
                        onClick: () => handleBulkRoleChange(true),
                        disabled: bulkActionLoading
                    },
                    {
                        label: 'Remove Admin',
                        icon: UserCheck,
                        onClick: () => handleBulkRoleChange(false),
                        disabled: bulkActionLoading
                    },
                    {
                        label: 'Delete Selected',
                        icon: Trash2,
                        onClick: handleBulkDelete,
                        disabled: bulkActionLoading,
                        variant: 'destructive'
                    }
                ]}
            />

            {/* Add Person Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>New Person</DialogTitle>
                        <DialogDescription>Add a new team member to the portal</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Name & ID */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    placeholder="Ex: John Smith"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    disabled={createLoading}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="employeeId">Employee ID</Label>
                                <Input
                                    id="employeeId"
                                    placeholder="Ex: EMP101"
                                    value={newEmployeeId}
                                    onChange={(e) => setNewEmployeeId(e.target.value)}
                                    disabled={createLoading}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                disabled={createLoading}
                            />
                        </div>

                        {/* Dept & Role */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Department</Label>
                                <Select
                                    value={newDepartment}
                                    onValueChange={(v) => setNewDepartment(v)}
                                    disabled={createLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map(d => (
                                            <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="position">Job Title</Label>
                                <Input
                                    id="position"
                                    placeholder="Ex: Senior Designer"
                                    value={newPosition}
                                    onChange={(e) => setNewPosition(e.target.value)}
                                    disabled={createLoading}
                                />
                            </div>
                        </div>

                        {/* Type & Password */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Account Type</Label>
                                <Select
                                    value={newEmployeeType}
                                    onValueChange={(v: any) => setNewEmployeeType(v)}
                                    disabled={createLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full-time">Full-Time</SelectItem>
                                        <SelectItem value="part-time">Part-Time</SelectItem>
                                        <SelectItem value="contract">Contractor</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Min 6 characters"
                                        value={newUserPassword}
                                        onChange={(e) => setNewUserPassword(e.target.value)}
                                        disabled={createLoading}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground/40 hover:text-primary transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCreateDialogOpen(false)}
                            disabled={createLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateUser}
                            disabled={createLoading}
                        >
                            {createLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                            Create Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}


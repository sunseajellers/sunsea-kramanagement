'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from '@/components/ui/dialog'
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
import { UserCheck, Search, Download, MoreHorizontal, UserPlus, Eye, EyeOff, Shield, Activity, Loader2, Users, ChevronLeft, ChevronRight, Trash2, Edit2 } from 'lucide-react'
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
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [createLoading, setCreateLoading] = useState(false)

    // Form state (Shared for Create/Edit)
    const [formEmail, setFormEmail] = useState('')
    const [formPassword, setFormPassword] = useState('')
    const [formName, setFormName] = useState('')
    const [formEmployeeId, setFormEmployeeId] = useState('')
    const [formDepartment, setFormDepartment] = useState('')
    const [formPosition, setFormPosition] = useState('')
    const [formEmployeeType, setFormEmployeeType] = useState<EmployeeTypeEnum>('full-time')
    const [showPassword, setShowPassword] = useState(false)

    // Filtering and search state
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<string>('name')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    useEffect(() => {
        loadData()
    }, [])

    const generateNextEmployeeId = () => {
        const lastId = users.reduce((max, u) => {
            const num = parseInt(u.employeeId?.replace('EMP-', '') || '0')
            return num > max ? num : max
        }, 0)
        setFormEmployeeId(`EMP-${String(lastId + 1).padStart(3, '0')}`)
    }

    const openEdit = (u: User) => {
        setSelectedUser(u)
        setFormName(u.fullName)
        setFormEmail(u.email)
        setFormEmployeeId(u.employeeId || '')
        setFormDepartment(u.department || '')
        setFormPosition(u.position || '')
        setFormEmployeeType(u.employeeType || 'full-time')
        setEditDialogOpen(true)
    }

    const resetForm = () => {
        setFormName('')
        setFormEmail('')
        setFormPassword('')
        setFormEmployeeId('')
        setFormDepartment('')
        setFormPosition('')
        setFormEmployeeType('full-time')
        setShowPassword(false)
    }

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

        if (!formEmail || !formPassword || !formName || !formEmployeeId) {
            toast.error('Please fill in all required fields (Name, Email, Password, Employee ID)')
            return
        }

        if (formPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        setCreateLoading(true)

        try {
            const idToken = await user.getIdToken()
            await createUser(
                formEmail,
                formPassword,
                formName,
                {
                    employeeId: formEmployeeId,
                    department: formDepartment,
                    position: formPosition,
                    employeeType: formEmployeeType
                },
                [],
                idToken
            )

            toast.success(`User ${formName} created successfully!`)
            setCreateDialogOpen(false)
            resetForm()
            loadUsers()
        } catch (error: any) {
            toast.error(error.message || 'Failed to create user')
        } finally {
            setCreateLoading(false)
        }
    }

    const handleUpdateUser = async () => {
        if (!selectedUser) return
        setCreateLoading(true)
        try {
            await updateUser(selectedUser.id, {
                fullName: formName,
                employeeId: formEmployeeId,
                department: formDepartment,
                position: formPosition,
                employeeType: formEmployeeType
            })
            toast.success('User updated successfully')
            setEditDialogOpen(false)
            resetForm()
            loadUsers()
        } catch (error: any) {
            toast.error(error.message || 'Failed to update user')
        } finally {
            setCreateLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="page-container flex-center">
                <div className="flex flex-col items-center gap-6">
                    <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
                    <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Checking team list...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in">
            {/* Header */}
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="section-title">Our Team</h1>
                    <p className="section-subtitle">See everyone who works here and what they can do</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={exportUsers}
                        className="btn-secondary h-10 w-10 p-0 flex items-center justify-center rounded-lg"
                        title="Download as CSV"
                    >
                        <Download className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => {
                            resetForm();
                            generateNextEmployeeId();
                            setCreateDialogOpen(true);
                        }}
                        className="btn-primary h-10 px-6"
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Person
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel p-6 flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                    <Input
                        placeholder="Search for a person..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="pl-9 h-10 bg-white/50"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-[160px]">
                        <Select
                            value={statusFilter}
                            onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
                        >
                            <SelectTrigger className="h-10 bg-white/50 border-input">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Any Status</SelectItem>
                                <SelectItem value="active">Active Now</SelectItem>
                                <SelectItem value="inactive">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-[160px]">
                        <Select
                            value={sortBy}
                            onValueChange={(v) => setSortBy(v)}
                        >
                            <SelectTrigger className="h-10 bg-white/50 border-input">
                                <SelectValue placeholder="Sort by" />
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
                        className="h-10 w-10 rounded-xl bg-muted/50 border border-border/50 hover:bg-muted text-primary transition-all flex items-center justify-center font-bold text-xs"
                    >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                </div>
            </div>

            {/* People List */}
            <div className="glass-panel p-0 flex flex-col overflow-hidden shadow-xl shadow-black/[0.01]">
                <div className="flex items-center justify-between px-8 py-6 border-b border-border/40 bg-muted/30">
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-primary/60" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                            {filteredUsers.length} Team Members
                        </span>
                    </div>
                    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-border/50 shadow-sm">
                        <span className="text-[8px] text-muted-foreground/60 font-black uppercase tracking-widest">Select All</span>
                        <Checkbox
                            checked={bulkSelection.isAllSelected}
                            onCheckedChange={() => bulkSelection.toggleAll()}
                            className="w-4 h-4 rounded-md border-border"
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
                                <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Join Date</th>
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
                                        <td className="px-8 py-5">
                                            <div className="flex items-center justify-center">
                                                <Checkbox
                                                    checked={bulkSelection.isSelected(u.id)}
                                                    onCheckedChange={() => bulkSelection.toggleSelection(u.id)}
                                                    className="w-4 h-4 rounded-md border-border"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xs shadow-lg shadow-primary/20 ring-4 ring-white shrink-0">
                                                    {u.fullName.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-base font-black text-primary uppercase tracking-tight group-hover:text-secondary transition-colors truncate">{u.fullName}</p>
                                                    <p className="text-[11px] text-muted-foreground/60 font-medium truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="text-[10px] font-black text-primary font-mono tracking-widest bg-muted px-2.5 py-1 rounded-lg border border-border shadow-sm">
                                                {(u as any).employeeId || 'NX-000'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={cn(
                                                "status-badge",
                                                u.isActive !== false ? "status-badge-success" : "status-badge-danger"
                                            )}>
                                                {u.isActive !== false ? 'ACTIVE' : 'SUSPENDED'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="text-[9px] font-black text-primary/60 uppercase tracking-[0.1em] bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
                                                {(u as any).department || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="text-[11px] text-muted-foreground font-bold uppercase">
                                                {u.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="h-10 w-10 flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-border/50 hover:bg-muted">
                                                        <MoreHorizontal className="h-6 w-6 text-muted-foreground" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-64 p-3 rounded-3xl border border-border bg-card shadow-2xl animate-in fade-in slide-in-from-top-2">
                                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 px-5 py-4">Options</DropdownMenuLabel>
                                                    <DropdownMenuSeparator className="bg-muted mx-3" />
                                                    <DropdownMenuItem
                                                        onClick={() => openEdit(u)}
                                                        className="rounded-2xl text-[11px] font-black uppercase tracking-widest py-4 px-5 flex items-center gap-4 focus:bg-primary/5 focus:text-primary cursor-pointer transition-colors"
                                                    >
                                                        <Edit2 className="h-5 w-5 opacity-40" />
                                                        Edit Details
                                                    </DropdownMenuItem>
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
                                            <div className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center">
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

            {/* Account Dialog (Unified Create/Edit) */}
            <Dialog
                open={createDialogOpen || editDialogOpen}
                onOpenChange={(val) => {
                    if (!val) {
                        setCreateDialogOpen(false);
                        setEditDialogOpen(false);
                    }
                }}
            >
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-sm border border-primary/10">
                                {createDialogOpen ? <UserPlus className="w-8 h-8" /> : <Edit2 className="w-8 h-8" />}
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                                    {createDialogOpen ? 'Add New Person' : 'Edit Person'}
                                </DialogTitle>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                    {createDialogOpen ? 'Add someone new to the team' : `Updating details for ${formName}`}
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={(e) => { e.preventDefault(); createDialogOpen ? handleCreateUser() : handleUpdateUser(); }} className="space-y-10 py-6">
                        {/* Primary Identity Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-8 w-1 bg-primary rounded-full transition-all" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Personal Info</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="grid gap-2.5">
                                    <Label htmlFor="fullName" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Full Name *</Label>
                                    <Input
                                        id="fullName"
                                        placeholder="Ex: John Smith"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        disabled={createLoading}
                                        className="h-12 bg-slate-50/50 border-slate-100"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2.5">
                                    <Label htmlFor="employeeId" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Employee ID *</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="employeeId"
                                            placeholder="Ex: EMP101"
                                            value={formEmployeeId}
                                            onChange={(e) => setFormEmployeeId(e.target.value)}
                                            disabled={createLoading}
                                            className="h-12 bg-slate-50/50 border-slate-100"
                                            required
                                        />
                                        {createDialogOpen && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={generateNextEmployeeId}
                                                className="h-12 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-100"
                                            >
                                                Auto
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-2.5">
                                <Label htmlFor="email" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Email Address *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    value={formEmail}
                                    onChange={(e) => setFormEmail(e.target.value)}
                                    disabled={createLoading || editDialogOpen}
                                    className="h-12 bg-slate-50/50 border-slate-100"
                                    required
                                />
                            </div>
                        </div>

                        {/* Professional Details Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-8 w-1 bg-secondary rounded-full transition-all" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Work Info</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="grid gap-2.5">
                                    <Label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Department</Label>
                                    <Select
                                        value={formDepartment}
                                        onValueChange={(v) => setFormDepartment(v)}
                                        disabled={createLoading}
                                    >
                                        <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100">
                                            <SelectValue placeholder="Select Department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.length > 0 ? (
                                                departments.map(d => (
                                                    <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">No Departments Found</p>
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2.5">
                                    <Label htmlFor="position" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Job Title / Role</Label>
                                    <Input
                                        id="position"
                                        placeholder="Ex: Senior Designer"
                                        value={formPosition}
                                        onChange={(e) => setFormPosition(e.target.value)}
                                        disabled={createLoading}
                                        className="h-12 bg-slate-50/50 border-slate-100"
                                    />
                                </div>

                                <div className="grid gap-2.5">
                                    <Label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Employment Basis</Label>
                                    <Select
                                        value={formEmployeeType}
                                        onValueChange={(v: any) => setFormEmployeeType(v)}
                                        disabled={createLoading}
                                    >
                                        <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100">
                                            <SelectValue placeholder="Select Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="full-time">Full-Time Staff</SelectItem>
                                            <SelectItem value="part-time">Part-Time / Seasonal</SelectItem>
                                            <SelectItem value="contract">Professional Contractor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {createDialogOpen && (
                                    <div className="grid gap-2.5">
                                        <Label htmlFor="password" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Security Credentials *</Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Min 6 characters"
                                                value={formPassword}
                                                onChange={(e) => setFormPassword(e.target.value)}
                                                disabled={createLoading}
                                                className="h-12 pr-12 bg-slate-50/50 border-slate-100"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 px-4 flex items-center text-muted-foreground/30 hover:text-primary transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="pt-8 border-t border-slate-100">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setCreateDialogOpen(false);
                                    setEditDialogOpen(false);
                                }}
                                disabled={createLoading}
                                className="h-12 px-8 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createLoading}
                                className="h-12 px-10 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
                            >
                                {createLoading ? <Loader2 className="animate-spin h-5 w-5 mr-3" /> : (createDialogOpen ? <UserPlus className="w-5 h-5 mr-3" /> : <Shield className="w-5 h-5 mr-3" />)}
                                {createDialogOpen ? 'Create Account' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}


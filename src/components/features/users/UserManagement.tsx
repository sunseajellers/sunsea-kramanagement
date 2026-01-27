'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent } from '@/components/ui/dialog'
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
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center animate-pulse">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Loading users...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in">
            {/* Header */}
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="section-title">Personnel Command</h1>
                    <p className="section-subtitle">Manage organization structure, access vectors and member identities</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={exportUsers}
                        className="h-12 w-12 p-0 rounded-2xl border-2 border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all shadow-sm"
                    >
                        <Download className="h-5 w-5" />
                    </Button>
                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="btn-primary h-12 px-6"
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Instate Personnel
                    </Button>
                </div>
            </div>

            {/* Strategic Filters */}
            <div className="glass-panel p-6 flex items-center gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        placeholder="Scan registry by name, identity or email vector..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="form-input pl-12 h-12"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="form-input h-12 px-5 text-[10px] font-black uppercase tracking-widest appearance-none min-w-[140px]"
                    >
                        <option value="all">Every Status</option>
                        <option value="active">Operational</option>
                        <option value="inactive">Suspended</option>
                    </select>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="form-input h-12 px-5 text-[10px] font-black uppercase tracking-widest appearance-none min-w-[140px]"
                    >
                        <option value="name">Sort: Identity</option>
                        <option value="email">Sort: Liaison</option>
                        <option value="joined">Sort: Onboarded</option>
                    </select>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600 transition-all"
                    >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                    </Button>
                </div>
            </div>

            {/* Personnel Ledger Table */}
            <div className="glass-panel p-0 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            {filteredUsers.length} MEMBERS REGISTERED
                        </span>
                    </div>
                    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Master Select</span>
                        <Checkbox
                            checked={bulkSelection.isAllSelected}
                            onCheckedChange={() => bulkSelection.toggleAll()}
                            className="w-5 h-5 rounded-md border-slate-200"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto scroll-panel">
                    <table className="w-full border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th className="px-8 py-5 text-left w-16"></th>
                                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Personnel Profile</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identity ID</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tactical Status</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Strategic Sector</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Onboarded</th>
                                <th className="px-8 py-5 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {paginatedUsers.length > 0 ? (
                                paginatedUsers.map((u) => (
                                    <tr key={u.id} className={cn(
                                        "group transition-all duration-300",
                                        bulkSelection.isSelected(u.id) ? 'bg-indigo-50/50' : 'hover:bg-slate-50/30'
                                    )}>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-center">
                                                <Checkbox
                                                    checked={bulkSelection.isSelected(u.id)}
                                                    onCheckedChange={() => bulkSelection.toggleSelection(u.id)}
                                                    className="w-5 h-5 rounded-md border-slate-200"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-xl shadow-indigo-100 ring-4 ring-white">
                                                    {u.fullName.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{u.fullName}</p>
                                                    <p className="text-[11px] text-slate-400 font-medium italic">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-[11px] font-black text-slate-600 font-mono tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                                {(u as any).employeeId || 'NX-000'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={cn(
                                                "status-badge",
                                                u.isActive !== false ? "status-badge-success" : "status-badge-danger"
                                            )}>
                                                {u.isActive !== false ? 'OPERATIONAL' : 'SUSPENDED'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <Badge variant="outline" className="border-indigo-100 text-indigo-600 font-black text-[10px] uppercase tracking-widest bg-indigo-50/30 rounded-xl px-3 py-1.5">
                                                {(u as any).department || 'GENERAL SERVICES'}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-[11px] text-slate-400 font-black uppercase tracking-tighter">
                                                {u.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-slate-200">
                                                        <MoreHorizontal className="h-5 w-5 text-slate-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-64 p-2 rounded-[2rem] border-none shadow-2xl animate-in fade-in slide-in-from-top-2">
                                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4 py-3">Vector Controls</DropdownMenuLabel>
                                                    <DropdownMenuSeparator className="bg-slate-50 mx-2" />
                                                    <DropdownMenuItem
                                                        onClick={() => updateUser(u.id, { isAdmin: !u.isAdmin })}
                                                        className="rounded-xl text-[11px] font-black uppercase tracking-widest py-3 px-4 flex items-center gap-3 focus:bg-indigo-50 focus:text-indigo-600 cursor-pointer transition-colors"
                                                    >
                                                        <Shield className="h-4 w-4 opacity-70" />
                                                        {u.isAdmin ? 'Revoke High Access' : 'Authorize High Access'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => updateUser(u.id, { isActive: u.isActive === false })}
                                                        className="rounded-xl text-[11px] font-black uppercase tracking-widest py-3 px-4 flex items-center gap-3 focus:bg-slate-50 cursor-pointer transition-colors"
                                                    >
                                                        <Activity className="h-4 w-4 opacity-70" />
                                                        {u.isActive === false ? 'Activate Identity' : 'Suspend Identity'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-slate-50 mx-2" />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteUser(u.id, u.fullName)}
                                                        className="rounded-xl text-[11px] font-black uppercase tracking-widest py-3 px-4 flex items-center gap-3 text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Expunge Record
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center border border-slate-100">
                                                <Users className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <p className="text-lg font-black text-slate-400 uppercase tracking-tight">Personnel Not Located</p>
                                            <p className="text-sm text-slate-400 font-medium">Refine search vector or initialize new onboarding</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Matrix */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-8 py-6 border-t border-slate-100 bg-slate-50/30">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            DATA GRID PAGE {currentPage} OF {totalPages}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 disabled:opacity-30"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const page = i + 1
                                return (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-10 w-10 rounded-xl text-[11px] font-black transition-all",
                                            currentPage === page
                                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                                                : "text-slate-500 hover:bg-white hover:border-slate-200 border border-transparent"
                                        )}
                                    >
                                        {page}
                                    </Button>
                                )
                            })}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 disabled:opacity-30"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mass Control Interface */}
            <BulkActionBar
                selectedCount={bulkSelection.selectedCount}
                onClear={bulkSelection.clearSelection}
                actions={[
                    {
                        label: 'Suspend Active',
                        icon: EyeOff,
                        onClick: () => handleBulkDeactivate(false),
                        disabled: bulkActionLoading
                    },
                    {
                        label: 'Authorize Admin',
                        icon: Shield,
                        onClick: () => handleBulkRoleChange(true),
                        disabled: bulkActionLoading
                    },
                    {
                        label: 'Revoke Admin',
                        icon: UserCheck,
                        onClick: () => handleBulkRoleChange(false),
                        disabled: bulkActionLoading
                    },
                    {
                        label: 'Expunge Records',
                        icon: Trash2,
                        onClick: handleBulkDelete,
                        disabled: bulkActionLoading,
                        variant: 'destructive'
                    }
                ]}
            />

            {/* Personnel Onboarding Overlay */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden border-none rounded-[3rem] shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-800 px-10 py-12 text-white relative">
                        <div className="absolute top-0 right-0 p-10 opacity-10">
                            <UserPlus className="w-32 h-32 rotate-6" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight uppercase">Instate Staff</h2>
                        <p className="text-indigo-100 text-[10px] font-black mt-1 uppercase tracking-[0.3em] opacity-80">Initialize internal liaison access</p>
                    </div>

                    <div className="p-10 space-y-8 bg-white overflow-y-auto max-h-[75vh] scroll-panel">
                        {/* Primary Identity */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Legal Nomenclature *</label>
                                <input
                                    placeholder="Ex: Alexander Vanguard"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    disabled={createLoading}
                                    className="form-input h-14"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Registry ID *</label>
                                <input
                                    placeholder="Ex: EMP-99X"
                                    value={newEmployeeId}
                                    onChange={(e) => setNewEmployeeId(e.target.value)}
                                    disabled={createLoading}
                                    className="form-input h-14"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Liaison Email Vector *</label>
                            <input
                                type="email"
                                placeholder="name@organization.com"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                disabled={createLoading}
                                className="form-input h-14"
                            />
                        </div>

                        {/* Structural Vectors */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Strategic Sector</label>
                                <select
                                    value={newDepartment}
                                    onChange={(e) => setNewDepartment(e.target.value)}
                                    disabled={createLoading}
                                    className="form-input h-14 appearance-none px-5"
                                >
                                    <option value="">Select Domain</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.name}>{d.name}</option>
                                    ))}
                                    <option value="Sales">Sales Force</option>
                                    <option value="Accounts">Capital Management</option>
                                    <option value="IT">Systems Ops</option>
                                    <option value="Operations">Tactical Hub</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Operational Role</label>
                                <input
                                    placeholder="Ex: Mission Architect"
                                    value={newPosition}
                                    onChange={(e) => setNewPosition(e.target.value)}
                                    disabled={createLoading}
                                    className="form-input h-14"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Classification Vector</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['full-time', 'part-time', 'contract'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setNewEmployeeType(type as any)}
                                        className={cn(
                                            "h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300",
                                            newEmployeeType === type
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100"
                                                : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300"
                                        )}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Secure Passkey *</label>
                            <div className="relative group/pass">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="MIN 8 CHARACTERS"
                                    value={newUserPassword}
                                    onChange={(e) => setNewUserPassword(e.target.value)}
                                    disabled={createLoading}
                                    className="form-input h-14 pr-14"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 px-5 flex items-center text-slate-300 hover:text-indigo-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                variant="ghost"
                                onClick={() => setCreateDialogOpen(false)}
                                disabled={createLoading}
                                className="flex-1 h-16 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-50 transition-all"
                            >
                                Abort
                            </Button>
                            <Button
                                onClick={handleCreateUser}
                                disabled={createLoading}
                                className="flex-1 h-16 btn-primary"
                            >
                                {createLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Authorize Entry'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

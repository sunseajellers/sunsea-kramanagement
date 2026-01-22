'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
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

const ITEMS_PER_PAGE = 8;

export default function UserManagement() {
    const { user } = useAuth()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [bulkActionLoading, setBulkActionLoading] = useState(false)

    // Create user dialog state
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)
    const [newUserEmail, setNewUserEmail] = useState('')
    const [newUserPassword, setNewUserPassword] = useState('')
    const [newUserName, setNewUserName] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    // Filtering and search state
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<string>('name')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        try {
            const userList = await getAllUsers()
            setUsers(userList)
        } catch (error) {
            toast.error('Failed to load users')
        } finally {
            setLoading(false)
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

        if (!newUserEmail || !newUserPassword || !newUserName) {
            toast.error('Please fill in all fields')
            return
        }

        if (newUserPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        setCreateLoading(true)

        try {
            const idToken = await user.getIdToken()
            await createUser(newUserEmail, newUserPassword, newUserName, [], idToken)

            toast.success(`User ${newUserName} created successfully!`)
            setCreateDialogOpen(false)
            setNewUserEmail('')
            setNewUserPassword('')
            setNewUserName('')
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
        <div className="page-container">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-400 text-xs font-medium flex items-center gap-1.5 mt-0.5">
                        <UserCheck className="h-3 w-3 text-blue-500" />
                        Manage platform users and access levels
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="bg-gray-900 hover:bg-black h-9 px-4 rounded-xl font-semibold text-xs"
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                    </Button>
                    <Button
                        variant="outline"
                        onClick={exportUsers}
                        className="h-9 w-9 p-0 rounded-xl border-gray-200"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="glass-card p-3 mb-4 flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <Input
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="pl-10 h-9 border-none bg-gray-50/50 rounded-lg text-sm"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="h-9 px-3 bg-gray-50/50 rounded-lg text-xs font-medium text-gray-600 border-none focus:ring-1 focus:ring-purple-200"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-9 px-3 bg-gray-50/50 rounded-lg text-xs font-medium text-gray-600 border-none focus:ring-1 focus:ring-purple-200"
                >
                    <option value="name">Sort: Name</option>
                    <option value="email">Sort: Email</option>
                    <option value="joined">Sort: Joined</option>
                </select>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="h-9 w-9 p-0 rounded-lg bg-gray-50/50"
                >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
            </div>

            {/* Users Table */}
            <div className="glass-card flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-400">{filteredUsers.length} users</span>
                    <div className="flex items-center gap-2 mr-2">
                        <Checkbox
                            checked={bulkSelection.isAllSelected}
                            onCheckedChange={() => bulkSelection.toggleAll()}
                            className="w-4 h-4"
                        />
                        <span className="text-[10px] text-gray-400 font-medium">Select All</span>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th className="w-10"></th>
                                <th>User</th>
                                <th className="text-center">Status</th>
                                <th className="text-center">Role</th>
                                <th className="text-center">Joined</th>
                                <th className="w-12"></th>
                            </tr>
                        </thead>
                    </table>
                    <div className="scroll-panel flex-1">
                        <table className="data-table">
                            <tbody>
                                {paginatedUsers.length > 0 ? (
                                    paginatedUsers.map((u) => (
                                        <tr key={u.id} className={`group ${bulkSelection.isSelected(u.id) ? 'bg-purple-50/30' : ''}`}>
                                            <td className="w-10">
                                                <Checkbox
                                                    checked={bulkSelection.isSelected(u.id)}
                                                    onCheckedChange={() => bulkSelection.toggleSelection(u.id)}
                                                    className="w-4 h-4"
                                                />
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xs">
                                                        {u.fullName.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{u.fullName}</p>
                                                        <p className="text-[11px] text-gray-400">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className={`badge ${u.isActive !== false ? 'badge-success' : 'badge-danger'}`}>
                                                    {u.isActive !== false ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                {u.isAdmin ? (
                                                    <span className="badge badge-info">Admin</span>
                                                ) : (
                                                    <span className="badge badge-neutral">Employee</span>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                <span className="text-xs text-gray-500">
                                                    {u.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                                                </span>
                                            </td>
                                            <td className="w-12">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl">
                                                        <DropdownMenuLabel className="text-[10px] font-semibold text-gray-400 px-2 py-1">Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => updateUser(u.id, { isAdmin: !u.isAdmin })}
                                                            className="rounded-lg text-xs"
                                                        >
                                                            <Shield className="h-3.5 w-3.5 mr-2 opacity-50" />
                                                            {u.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => updateUser(u.id, { isActive: u.isActive === false })}
                                                            className="rounded-lg text-xs"
                                                        >
                                                            <Activity className="h-3.5 w-3.5 mr-2 opacity-50" />
                                                            {u.isActive === false ? 'Activate' : 'Suspend'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteUser(u.id, u.fullName)}
                                                            className="rounded-lg text-xs text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                            Delete User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="empty-state my-8">
                                                <div className="empty-state-icon">
                                                    <Users className="w-6 h-6" />
                                                </div>
                                                <p className="empty-state-title">No users found</p>
                                                <p className="empty-state-description">Try adjusting your search or filter criteria</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0 rounded-lg"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const page = i + 1
                                return (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className={`h-8 w-8 p-0 rounded-lg text-xs ${currentPage === page ? 'bg-purple-600' : ''}`}
                                    >
                                        {page}
                                    </Button>
                                )
                            })}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-8 w-8 p-0 rounded-lg"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Action Bar */}
            <BulkActionBar
                selectedCount={bulkSelection.selectedCount}
                onClear={bulkSelection.clearSelection}
                actions={[
                    {
                        label: 'Suspend Users',
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
                        label: 'Make Employee',
                        icon: UserCheck,
                        onClick: () => handleBulkRoleChange(false),
                        disabled: bulkActionLoading
                    },
                    {
                        label: 'Delete Users',
                        icon: Trash2,
                        onClick: handleBulkDelete,
                        disabled: bulkActionLoading,
                        variant: 'destructive'
                    }
                ]}
            />

            {/* Create User Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-none rounded-2xl shadow-2xl">
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-6 text-white">
                        <h2 className="text-lg font-bold">Create New User</h2>
                        <p className="text-gray-400 text-xs mt-1">Add a new user to the platform</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500">Full Name</label>
                            <Input
                                placeholder="Enter full name"
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                disabled={createLoading}
                                className="h-11 rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500">Email Address</label>
                            <Input
                                type="email"
                                placeholder="Enter email address"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                disabled={createLoading}
                                className="h-11 rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500">Password</label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min. 6 characters"
                                    value={newUserPassword}
                                    onChange={(e) => setNewUserPassword(e.target.value)}
                                    disabled={createLoading}
                                    className="h-11 rounded-xl pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setCreateDialogOpen(false)}
                                disabled={createLoading}
                                className="flex-1 h-11 rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateUser}
                                disabled={createLoading}
                                className="flex-1 h-11 bg-purple-600 hover:bg-purple-700 rounded-xl"
                            >
                                {createLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Create User'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

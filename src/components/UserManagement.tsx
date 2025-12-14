'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { User, Permission } from '@/types'
import { getAllUsers, updateUser, deleteUser, bulkUpdateUsers } from '@/lib/userService'
import { assignRolesToUser, getAllRoles, getUserPermissions } from '@/lib/rbacService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import toast from 'react-hot-toast'
import { UserCheck, Settings, Shield, Search, Filter, Download, Trash2, Edit, Users, MoreHorizontal, CheckSquare, Square } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface BulkAction {
    type: 'role_change' | 'delete' | 'activate' | 'deactivate'
    value?: string
}

export default function UserManagement() {
    const { userData: currentUser } = useAuth()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
    const [bulkAction, setBulkAction] = useState<BulkAction | null>(null)

    // Filtering and search state
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('all')
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
            const matchesRole = roleFilter === 'all'
            const matchesStatus = statusFilter === 'all' ||
                                (statusFilter === 'active' && user.isActive !== false) ||
                                (statusFilter === 'inactive' && user.isActive === false)

            return matchesSearch && matchesRole && matchesStatus
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
                case 'role':
                    aValue = 'employee'
                    bValue = 'employee'
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
    }, [users, searchTerm, roleFilter, statusFilter, sortBy, sortOrder])

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (!currentUser) {
            toast.error('You must be logged in to perform this action')
            return
        }

        // Find the target user
        const targetUser = users.find(u => u.id === userId)
        if (!targetUser) {
            toast.error('User not found')
            return
        }

        try {
            // First, find the role ID for the new role
            const roles = await getAllRoles()
            const roleToAssign = roles.find(r => r.name.toLowerCase() === newRole.toLowerCase())
            if (roleToAssign) {
                await assignRolesToUser(userId, [roleToAssign.id], currentUser!.uid)
                toast.success('Role updated successfully')
                loadUsers()
            } else {
                toast.error('Role not found')
            }
        } catch (error) {
            toast.error('Failed to update role')
        }
    }

    const handleBulkAction = async () => {
        if (!bulkAction || selectedUsers.size === 0) return

        try {
            const userIds = Array.from(selectedUsers)

            switch (bulkAction.type) {
                case 'role_change':
                    if (!bulkAction.value) return
                    const roles = await getAllRoles()
                    const roleToAssign = roles.find(r => r.name.toLowerCase() === bulkAction.value!.toLowerCase())
                    if (roleToAssign) {
                        for (const userId of userIds) {
                            await assignRolesToUser(userId, [roleToAssign.id], currentUser!.uid)
                        }
                        toast.success(`Updated ${userIds.length} users' roles`)
                    } else {
                        toast.error('Role not found')
                    }
                    break
                case 'delete':
                    for (const userId of userIds) {
                        await deleteUser(userId)
                    }
                    toast.success(`Deleted ${userIds.length} users`)
                    break
                case 'activate':
                    await bulkUpdateUsers(userIds, { isActive: true })
                    toast.success(`Activated ${userIds.length} users`)
                    break
                case 'deactivate':
                    await bulkUpdateUsers(userIds, { isActive: false })
                    toast.success(`Deactivated ${userIds.length} users`)
                    break
            }

            setSelectedUsers(new Set())
            setBulkDialogOpen(false)
            setBulkAction(null)
            loadUsers()
        } catch (error) {
            toast.error('Bulk operation failed')
        }
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUsers(new Set(filteredUsers.map(u => u.id)))
        } else {
            setSelectedUsers(new Set())
        }
    }

    const handleSelectUser = (userId: string, checked: boolean) => {
        const newSelected = new Set(selectedUsers)
        if (checked) {
            newSelected.add(userId)
        } else {
            newSelected.delete(userId)
        }
        setSelectedUsers(newSelected)
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

    const handleSavePermissions = async () => {
        if (!selectedUser) return

        // Permissions are now managed via RBAC roles
        toast.success('Permissions are now managed via RBAC roles. Please assign appropriate roles to users.')
        setDialogOpen(false)
    }

    const openPermissionDialog = (user: User) => {
        setSelectedUser(user)
        setDialogOpen(true)
    }

    const openBulkDialog = (action: BulkAction) => {
        setBulkAction(action)
        setBulkDialogOpen(true)
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800'
            case 'manager': return 'bg-blue-100 text-blue-800'
            case 'employee': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading users...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <UserCheck className="h-6 w-6" />
                    User Management
                </h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={exportUsers}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Filters and Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="employee">Employee</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="name">Name</option>
                            <option value="email">Email</option>
                            <option value="role">Role</option>
                            <option value="joined">Joined Date</option>
                        </select>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedUsers.size > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                    {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openBulkDialog({ type: 'role_change' })}
                                >
                                    Change Role
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openBulkDialog({ type: 'activate' })}
                                >
                                    Activate
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openBulkDialog({ type: 'deactivate' })}
                                >
                                    Deactivate
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => openBulkDialog({ type: 'delete' })}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Users List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Users ({filteredUsers.length})</CardTitle>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                                onCheckedChange={handleSelectAll}
                            />
                            <span className="text-sm text-muted-foreground">Select All</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredUsers.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <Checkbox
                                        checked={selectedUsers.has(user.id)}
                                        onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                                    />
                                    <div>
                                        <h3 className="font-medium">{user.fullName}</h3>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge className="bg-blue-100 text-blue-800">
                                                Employee
                                            </Badge>
                                            {user.isActive === false && (
                                                <Badge variant="secondary">Inactive</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-sm text-muted-foreground">
                                        Joined: {user.createdAt.toLocaleDateString()}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => openPermissionDialog(user)}>
                                                <Settings className="h-4 w-4 mr-2" />
                                                Permissions
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => updateUser(user.id, { isActive: user.isActive === false })}
                                            >
                                                {user.isActive === false ? 'Activate' : 'Deactivate'}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Permission Management Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Manage Permissions for {selectedUser?.fullName}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedUser && (
                        <div className="space-y-6">
                            <div className="bg-muted p-4 rounded-lg">
                                <h3 className="font-medium mb-2">Role: Employee</h3>
                                <p className="text-sm text-muted-foreground">
                                    Employee role with standard permissions managed via RBAC.
                                </p>
                                <div className="mt-2">
                                    <p className="text-sm font-medium">Current Permissions:</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {selectedUser && (
                                            <UserPermissionsDisplay userId={selectedUser.id} />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="border rounded-lg p-4">
                                    <h4 className="font-medium mb-3">Role Assignment</h4>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Assign RBAC roles to this user. Permissions are determined by assigned roles.
                                    </p>
                                    <RoleAssignment userId={selectedUser?.id || ''} onRoleChange={loadUsers} />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSavePermissions}>
                                    Save Permissions
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Bulk Action Confirmation Dialog */}
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Confirm Bulk Action
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p>
                            Are you sure you want to {bulkAction?.type.replace('_', ' ')} {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''}?
                        </p>
                        {bulkAction?.type === 'role_change' && (
                            <select
                                onChange={(value) => setBulkAction({ ...bulkAction, value: value.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select new role</option>
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                                <option value="employee">Employee</option>
                            </select>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant={bulkAction?.type === 'delete' ? 'destructive' : 'default'}
                                onClick={handleBulkAction}
                            >
                                Confirm
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Helper component to display user permissions
function UserPermissionsDisplay({ userId }: { userId: string }) {
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadPermissions = async () => {
            try {
                const userPermissions = await getUserPermissions(userId)
                setPermissions(userPermissions)
            } catch (error) {
                console.error('Failed to load permissions:', error)
            } finally {
                setLoading(false)
            }
        }
        loadPermissions()
    }, [userId])

    if (loading) return <div>Loading permissions...</div>

    return (
        <>
            {permissions.map((perm) => (
                <Badge key={`${perm.module}-${perm.action}`} variant="secondary" className="text-xs">
                    {perm.module}.{perm.action}
                </Badge>
            ))}
        </>
    )
}

// Helper component for role assignment
function RoleAssignment({ userId, onRoleChange }: { userId: string; onRoleChange: () => void }) {
    const [roles, setRoles] = useState<any[]>([])
    const [userRoles, setUserRoles] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const { userData } = useAuth()

    useEffect(() => {
        const loadData = async () => {
            try {
                const [allRoles, userPerms] = await Promise.all([
                    getAllRoles(),
                    getUserPermissions(userId)
                ])
                setRoles(allRoles)
                // For now, show all roles - in future we could determine assigned roles from permissions
                setUserRoles(allRoles.map(r => r.id))
            } catch (error) {
                console.error('Failed to load roles:', error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [userId])

    const handleRoleToggle = async (roleId: string, assign: boolean) => {
        if (!userData) return

        try {
            if (assign) {
                await assignRolesToUser(userId, [roleId], userData.uid)
            } else {
                // For now, we'll reassign all roles except the one being removed
                const newRoles = userRoles.filter(id => id !== roleId)
                await assignRolesToUser(userId, newRoles, userData.uid)
            }
            onRoleChange()
        } catch (error) {
            toast.error('Failed to update role assignment')
        }
    }

    if (loading) return <div>Loading roles...</div>

    return (
        <div className="space-y-2">
            {roles.map((role) => (
                <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                        id={role.id}
                        checked={userRoles.includes(role.id)}
                        onCheckedChange={(checked) => handleRoleToggle(role.id, checked as boolean)}
                    />
                    <label htmlFor={role.id} className="text-sm font-medium">
                        {role.name}
                    </label>
                    <span className="text-xs text-muted-foreground">
                        {role.description}
                    </span>
                </div>
            ))}
        </div>
    )
}
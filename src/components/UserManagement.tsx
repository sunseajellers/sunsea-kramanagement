'use client'

import { useState, useEffect } from 'react'
import { User, Permission } from '@/types'
import { getAllUsers, updateUser } from '@/lib/userService'
import { DEFAULT_ROLE_PERMISSIONS, PERMISSION_CATEGORIES, PERMISSION_DESCRIPTIONS, ROLE_CONFIGURATIONS } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import toast from 'react-hot-toast'
import { UserCheck, Settings, Shield } from 'lucide-react'

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [customPermissions, setCustomPermissions] = useState<Permission[]>([])
    const [dialogOpen, setDialogOpen] = useState(false)

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

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await updateUser(userId, { role: newRole as any })
            toast.success('Role updated successfully')
            loadUsers()
        } catch (error) {
            toast.error('Failed to update role')
        }
    }

    const handlePermissionToggle = (permission: Permission, checked: boolean) => {
        if (checked) {
            setCustomPermissions(prev => [...prev, permission])
        } else {
            setCustomPermissions(prev => prev.filter(p => p !== permission))
        }
    }

    const handleSavePermissions = async () => {
        if (!selectedUser) return

        try {
            await updateUser(selectedUser.id, { permissions: customPermissions })
            toast.success('Permissions updated successfully')
            setDialogOpen(false)
            loadUsers()
        } catch (error) {
            toast.error('Failed to update permissions')
        }
    }

    const openPermissionDialog = (user: User) => {
        setSelectedUser(user)
        setCustomPermissions(user.permissions || [])
        setDialogOpen(true)
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
            </div>

            <div className="grid gap-4">
                {users.map((user) => (
                    <Card key={user.id}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">{user.fullName}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className={getRoleBadgeColor(user.role)}>
                                        {user.role}
                                    </Badge>
                                    {user.isAdmin && (
                                        <Badge variant="destructive">
                                            <Shield className="h-3 w-3 mr-1" />
                                            Admin
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Role:</label>
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className="ml-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="employee">Employee</option>
                                            <option value="manager">Manager</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Joined: {user.createdAt.toLocaleDateString()}
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openPermissionDialog(user)}
                                >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Permissions
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

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
                                <h3 className="font-medium mb-2">Role: {selectedUser.role}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {ROLE_CONFIGURATIONS.find(r => r.role === selectedUser.role)?.description}
                                </p>
                                <div className="mt-2">
                                    <p className="text-sm font-medium">Default Permissions:</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {DEFAULT_ROLE_PERMISSIONS[selectedUser.role].map((perm) => (
                                            <Badge key={perm} variant="secondary" className="text-xs">
                                                {perm.replace(/_/g, ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
                                    <div key={category} className="border rounded-lg p-4">
                                        <h4 className="font-medium mb-3">{category}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {permissions.map((permission) => (
                                                <div key={permission} className="flex items-start space-x-2">
                                                    <Checkbox
                                                        id={permission}
                                                        checked={customPermissions.includes(permission)}
                                                        onCheckedChange={(checked) =>
                                                            handlePermissionToggle(permission, checked as boolean)
                                                        }
                                                    />
                                                    <div className="grid gap-1.5 leading-none">
                                                        <label
                                                            htmlFor={permission}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                        >
                                                            {permission.replace(/_/g, ' ')}
                                                        </label>
                                                        <p className="text-xs text-muted-foreground">
                                                            {PERMISSION_DESCRIPTIONS[permission]}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
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
        </div>
    )
}
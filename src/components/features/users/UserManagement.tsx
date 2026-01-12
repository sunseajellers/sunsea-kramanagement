'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'
import { UserCheck, Search, Download, MoreHorizontal, UserPlus, Eye, EyeOff, Shield, Activity, Loader2, Users } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getAllUsers, createUser, updateUser } from '@/lib/userService'



export default function UserManagement() {
    const { user } = useAuth()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

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
            // Get the current user's ID token for authentication
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
            <div className="flex flex-col items-center justify-center h-96 py-20">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Personnel...</p>
            </div>
        )
    }

    return (
        <div className="space-y-10 pb-12">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Personnel Hub</h1>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        <UserCheck className="h-3 w-3 text-blue-500" />
                        Manage platform users and access levels
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => setCreateDialogOpen(true)} className="bg-gray-900 hover:bg-black h-11 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        New User
                    </Button>
                    <Button variant="outline" onClick={exportUsers} className="h-11 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest border-gray-100 text-gray-400 hover:bg-white transition-all">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <Input
                        placeholder="SEARCH BY NAME OR EMAIL..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 border-none bg-gray-50/50 rounded-xl text-[10px] font-black uppercase tracking-widest placeholder:text-gray-300"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-12 px-6 bg-gray-50/50 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none border-none pr-10 relative cursor-pointer"
                    >
                        <option value="all">Status: All</option>
                        <option value="active">Status: Active</option>
                        <option value="inactive">Status: Inactive</option>
                    </select>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="h-12 px-6 bg-gray-50/50 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none border-none pr-10 cursor-pointer"
                    >
                        <option value="name">Sort: Name</option>
                        <option value="email">Sort: Email</option>
                        <option value="joined">Sort: Joined</option>
                    </select>
                    <Button
                        variant="ghost"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="h-12 w-12 rounded-xl bg-gray-50/50 text-gray-400 hover:text-blue-600"
                    >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                    </Button>
                </div>
            </div>

            {/* Users Content */}
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-gray-50 px-8 py-6 flex flex-row items-center justify-between bg-white">
                    <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Listing {filteredUsers.length} records</CardTitle>
                    <div className="flex items-center gap-3 bg-gray-50/50 p-2 rounded-xl px-4">
                        <Checkbox
                            checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                            onCheckedChange={handleSelectAll}
                            className="w-4 h-4 border-gray-200"
                        />
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Select All</span>
                    </div>
                </CardHeader>
                <div className="divide-y divide-gray-50">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                            <div key={user.id} className="group hover:bg-blue-50/20 transition-all px-8 py-6 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-8">
                                        <Checkbox
                                            checked={selectedUsers.has(user.id)}
                                            onCheckedChange={(checked: boolean) => handleSelectUser(user.id, checked)}
                                            className="w-4 h-4 border-gray-100 group-hover:border-blue-200"
                                        />
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all font-black text-xs uppercase text-gray-400">
                                                {user.fullName.substring(0, 2)}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{user.fullName}</h3>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{user.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-8 w-[1px] bg-gray-50 hidden md:block mx-2" />
                                    <div className="hidden lg:flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${user.isActive !== false ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                            {user.isActive !== false ? 'Active Status' : 'Inactive Status'}
                                        </span>
                                        {user.isAdmin && (
                                            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-widest border border-blue-100">
                                                Administrator
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-10">
                                    <div className="hidden xl:block text-right">
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Enrolled On</p>
                                        <p className="text-[10px] font-black text-gray-900 mt-0.5 uppercase tracking-tighter">{user.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 text-gray-400">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-gray-100 shadow-xl">
                                            <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 px-3 py-2">Quick Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator className="bg-gray-50" />
                                            <DropdownMenuItem
                                                onClick={() => updateUser(user.id, { isAdmin: !user.isAdmin })}
                                                className="cursor-pointer rounded-xl h-10 text-[10px] font-black uppercase tracking-widest focus:bg-blue-50 focus:text-blue-600"
                                            >
                                                <Shield className="h-3.5 w-3.5 mr-3 opacity-50" />
                                                {user.isAdmin ? 'Revoke Admin' : 'Assign Admin'}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => updateUser(user.id, { isActive: user.isActive === false })}
                                                className={`cursor-pointer rounded-xl h-10 text-[10px] font-black uppercase tracking-widest ${user.isActive === false ? 'focus:bg-green-50 focus:text-green-600' : 'focus:bg-red-50 focus:text-red-600'}`}
                                            >
                                                <Activity className="h-3.5 w-3.5 mr-3 opacity-50" />
                                                {user.isActive === false ? 'Activate User' : 'Suspend Account'}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center">
                            <Users className="h-10 w-10 text-gray-100 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">No records found matching criteria</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Minimal Create User Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
                    <div className="bg-gray-900 px-8 py-10 text-white">
                        <h2 className="text-2xl font-black uppercase tracking-tighter">New Personnel</h2>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Initialize system access</p>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Identity Profile</label>
                                <Input
                                    placeholder="FULL LEGAL NAME"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    disabled={createLoading}
                                    className="h-14 bg-gray-50 border-none rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest placeholder:text-gray-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Authentication Email</label>
                                <Input
                                    type="email"
                                    placeholder="CORPORATE EMAIL ADDRESS"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    disabled={createLoading}
                                    className="h-14 bg-gray-50 border-none rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest placeholder:text-gray-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Security Key (MIN 6 CHARACTERS)</label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="ENCRYPTED ACCESS KEY"
                                        value={newUserPassword}
                                        onChange={(e) => setNewUserPassword(e.target.value)}
                                        disabled={createLoading}
                                        className="h-14 bg-gray-50 border-none rounded-2xl px-6 pr-14 text-[10px] font-black uppercase tracking-widest placeholder:text-gray-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-6 flex items-center"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-gray-300" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-gray-300" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setCreateDialogOpen(false)}
                                disabled={createLoading}
                                className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest border-gray-100 text-gray-400"
                            >
                                ABORT
                            </Button>
                            <Button
                                onClick={handleCreateUser}
                                disabled={createLoading}
                                className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200"
                            >
                                {createLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'AUTHORIZE USER'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

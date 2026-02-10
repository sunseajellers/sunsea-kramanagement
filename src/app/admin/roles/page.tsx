'use client'

import { useState, useEffect, FormEvent } from 'react'
import { roleService } from '@/lib/roleService'
import { Role, Permission } from '@/types/rbac'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PermissionMatrix } from '@/components/features/rbac/PermissionMatrix'
import { Shield, Plus, Edit2, Trash2, Loader2, Info } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingRole, setEditingRole] = useState<Role | null>(null)
    const [roleName, setRoleName] = useState('')
    const [roleDescription, setRoleDescription] = useState('')
    const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadRoles()
    }, [])

    const loadRoles = async () => {
        try {
            setLoading(true)
            const data = await roleService.getAllRoles()
            setRoles(data)
        } catch (error) {
            toast.error('Failed to load roles')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenDialog = (role: Role | null = null) => {
        if (role) {
            setEditingRole(role)
            setRoleName(role.name)
            setRoleDescription(role.description || '')
            setSelectedPermissions(role.permissions)
        } else {
            setEditingRole(null)
            setRoleName('')
            setRoleDescription('')
            setSelectedPermissions([])
        }
        setDialogOpen(true)
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!roleName) {
            toast.error('Role name is required')
            return
        }

        setSubmitting(true)
        try {
            const roleData = {
                name: roleName,
                description: roleDescription,
                permissions: selectedPermissions,
            }

            const { logCustomActivity } = await import('@/lib/activityLogger')
            if (editingRole) {
                await roleService.updateRole(editingRole.id, roleData)
                await logCustomActivity('role_updated', 'roles', editingRole.id, roleName, `Role "${roleName}" updated`)
                toast.success('Role updated successfully')
            } else {
                const newRoleId = await roleService.createRole(roleData)
                await logCustomActivity('role_created', 'roles', newRoleId || 'new-role', roleName, `Role "${roleName}" created`)
                toast.success('Role created successfully')
            }
            setDialogOpen(false)
            loadRoles()
        } catch (error) {
            toast.error('Failed to save role')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete the "${name}" role?`)) return
        try {
            await roleService.deleteRole(id)
            const { logCustomActivity } = await import('@/lib/activityLogger')
            await logCustomActivity('role_deleted', 'roles', id, name, `Role "${name}" deleted`)
            toast.success('Role deleted successfully')
            loadRoles()
        } catch (error) {
            toast.error('Failed to delete role')
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500/50" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Retrieving Roles...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight font-rajdhani">Roles & Permissions</h1>
                    <p className="text-slate-400 text-sm mt-1">Define granular access levels for your team</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="btn-primary rounded-2xl px-6 h-12 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Create New Role</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map(role => (
                    <div key={role.id} className="glass-panel p-6 space-y-4 hover:border-indigo-500/30 transition-all group">
                        <div className="flex items-start justify-between">
                            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 group-hover:scale-110 transition-transform">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleOpenDialog(role)} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(role.id, role.name)} className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white font-rajdhani">{role.name}</h3>
                            <p className="text-slate-400 text-xs mt-1 line-clamp-2">{role.description || 'No description provided'}</p>
                        </div>
                        <div className="pt-4 border-t border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                {role.permissions.length} Active Permissions
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col p-0 glass-panel border-white/10 bg-slate-950/90 backdrop-blur-2xl">
                    <DialogHeader className="p-8 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-white tracking-tight font-rajdhani">
                                    {editingRole ? 'Edit Role' : 'Create New Role'}
                                </DialogTitle>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">
                                    Configure access levels and module permissions
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Role Name</Label>
                                <Input
                                    value={roleName}
                                    onChange={e => setRoleName(e.target.value)}
                                    placeholder="Ex: Store Manager"
                                    className="h-12 bg-white/5 border-white/10 focus:border-indigo-500/50 transition-all rounded-2xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Description</Label>
                                <Input
                                    value={roleDescription}
                                    onChange={e => setRoleDescription(e.target.value)}
                                    placeholder="Briefly describe what this role does"
                                    className="h-12 bg-white/5 border-white/10 focus:border-indigo-500/50 transition-all rounded-2xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Permission Matrix</Label>
                                <div className="flex items-center gap-2 text-indigo-400">
                                    <Info className="w-3 h-3" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Select granular actions per module</span>
                                </div>
                            </div>
                            <PermissionMatrix
                                selectedPermissions={selectedPermissions}
                                onChange={setSelectedPermissions}
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-8 border-t border-white/5 bg-white/[0.02]">
                        <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-2xl h-12 px-6 text-slate-400 hover:text-white">
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting} className="btn-primary rounded-2xl h-12 px-8 min-w-[140px]">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingRole ? 'Save Changes' : 'Create Role')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

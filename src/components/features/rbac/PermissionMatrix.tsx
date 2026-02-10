'use client'

import { FC } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Action, Permission } from '@/types/rbac'

interface PermissionMatrixProps {
    selectedPermissions: Permission[]
    onChange: (permissions: Permission[]) => void
}

const MODULES = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'users', label: 'User Management' },
    { id: 'roles', label: 'Roles & Permissions' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'okrs', label: 'OKRs Strategy' },
    { id: 'inventory', label: 'Inventory (Atelier)' },
    { id: 'crm', label: 'Clienteling' },
    { id: 'reports', label: 'Reports & BI' },
]

const ACTIONS: { id: Action; label: string }[] = [
    { id: 'view', label: 'View' },
    { id: 'create', label: 'Create' },
    { id: 'edit', label: 'Edit' },
    { id: 'delete', label: 'Delete' },
    { id: 'export', label: 'Export' },
    { id: 'manage', label: 'Manage' },
]

/**
 * PermissionMatrix
 * 
 * A Sunsea-styled grid for selecting granular permissions.
 */
export const PermissionMatrix: FC<PermissionMatrixProps> = ({
    selectedPermissions,
    onChange
}) => {
    const isChecked = (module: string, action: Action) => {
        return selectedPermissions.some(p => p.module === module && p.action === action)
    }

    const handleToggle = (module: string, action: Action) => {
        const index = selectedPermissions.findIndex(p => p.module === module && p.action === action)
        if (index > -1) {
            onChange(selectedPermissions.filter((_, i) => i !== index))
        } else {
            onChange([...selectedPermissions, { module, action }])
        }
    }

    return (
        <div className="w-full space-y-4 font-rajdhani">
            <div className="grid grid-cols-12 gap-4 pb-2 border-b border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-400">
                <div className="col-span-4">Module</div>
                <div className="col-span-8 grid grid-cols-6 text-center">
                    {ACTIONS.map(action => (
                        <div key={action.id}>{action.label}</div>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                {MODULES.map(module => (
                    <div
                        key={module.id}
                        className="grid grid-cols-12 gap-4 items-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                    >
                        <div className="col-span-4 text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                            {module.label}
                        </div>
                        <div className="col-span-8 grid grid-cols-6">
                            {ACTIONS.map(action => (
                                <div key={action.id} className="flex justify-center">
                                    <Checkbox
                                        checked={isChecked(module.id, action.id)}
                                        onCheckedChange={() => handleToggle(module.id, action.id)}
                                        className="border-white/20 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

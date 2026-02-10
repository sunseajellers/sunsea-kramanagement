'use client';

import { useState, useEffect } from 'react';
import { Role, RolePermissions } from '@/types';
import { getRoles, createRole } from '@/lib/securityService';
import { Button } from '@/components/ui/button';
import { Shield, Plus, Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const MODULES = ['CRM', 'Marketing', 'Sales', 'Staff', 'Helpdesk', 'OKR', 'Security'];

export default function RoleManagement() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newPermissions, setNewPermissions] = useState<RolePermissions>({});

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        const data = await getRoles();
        setRoles(data);
    };

    const handleCreateRole = async () => {
        if (!newRoleName) return;
        try {
            await createRole({
                name: newRoleName,
                permissions: newPermissions,
                isSystem: false
            });
            toast.success('Role created successfully');
            setIsCreating(false);
            setNewRoleName('');
            setNewPermissions({});
            loadRoles();
        } catch (error) {
            toast.error('Failed to create role');
        }
    };

    const togglePermission = (module: string, action: 'read' | 'write' | 'delete') => {
        setNewPermissions(prev => ({
            ...prev,
            [module]: {
                ...prev[module],
                [action]: !prev[module]?.[action]
            }
        }));
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Role & Permission Matrix</h2>
                    <p className="text-slate-500">Define granular access controls for each department</p>
                </div>
                <Button onClick={() => setIsCreating(true)} className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Custom Role
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Roles List */}
                <div className="glass-panel p-6 space-y-4">
                    <h3 className="font-bold text-lg mb-4">System Roles</h3>
                    <div className="space-y-3">
                        {roles.map(role => (
                            <div key={role.id} className="p-4 rounded-xl border border-slate-100 hover:border-primary/50 transition-colors cursor-pointer group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg", role.isSystem ? "bg-slate-100 text-slate-600" : "bg-indigo-50 text-indigo-600")}>
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-900">{role.name}</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{role.isSystem ? 'System Default' : 'Custom Role'}</p>
                                        </div>
                                    </div>
                                    {role.isSystem && <Lock className="w-3 h-3 text-slate-300" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Permission Matrix Editor */}
                {isCreating && (
                    <div className="lg:col-span-2 glass-panel p-6 space-y-6">
                        <div className="flex items-center gap-4 mb-6">
                            <input
                                type="text"
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                placeholder="Enter Role Name (e.g. Finance Manager)"
                                className="form-input text-lg font-bold"
                                autoFocus
                            />
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left py-3 px-4 text-xs font-black uppercase text-slate-400">Module</th>
                                        <th className="text-center py-3 px-4 text-xs font-black uppercase text-slate-400">Read</th>
                                        <th className="text-center py-3 px-4 text-xs font-black uppercase text-slate-400">Write</th>
                                        <th className="text-center py-3 px-4 text-xs font-black uppercase text-slate-400">Delete</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {MODULES.map(module => (
                                        <tr key={module} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                            <td className="py-3 px-4 font-bold text-sm text-slate-700">{module}</td>
                                            {['read', 'write', 'delete'].map((action) => (
                                                <td key={action} className="text-center py-3 px-4">
                                                    <button
                                                        onClick={() => togglePermission(module, action as any)}
                                                        className={cn(
                                                            "w-6 h-6 rounded border flex items-center justify-center transition-all mx-auto",
                                                            newPermissions[module]?.[action as keyof typeof newPermissions[typeof module]]
                                                                ? "bg-primary border-primary text-white"
                                                                : "border-slate-200 text-transparent hover:border-primary/50"
                                                        )}
                                                    >
                                                        <Check className="w-3 h-3" />
                                                    </button>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                            <Button onClick={handleCreateRole} className="btn-primary">Save Role</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

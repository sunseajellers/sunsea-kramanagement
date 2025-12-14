'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Shield, Users, Settings, Eye, Edit3, Trash } from 'lucide-react';
import { getAllRoles, createRole, updateRole, deleteRole, getRolePermissions, assignPermissionsToRole, getPermissionsByModule, initializeDefaultRBAC } from '@/lib/rbacService';
import { Role, Permission, UserRole } from '@/types';
import { toast } from 'sonner';

export default function RolesPage() {
    const { } = useAuth();
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isActive: true
    });
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    // Load data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [rolesData, permissionsData] = await Promise.all([
                getAllRoles(),
                getPermissionsByModule()
            ]);
            setRoles(rolesData);
            setPermissions(permissionsData);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load roles and permissions');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRole = async () => {
        try {
            const roleId = await createRole({
                name: formData.name,  // Can be any string for custom roles
                description: formData.description,
                isSystem: false,  // Custom roles are not system roles
                isActive: formData.isActive,
                permissions: selectedPermissions  // Include selected permissions
            });

            toast.success('Role created successfully');
            setDialogOpen(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Failed to create role:', error);
            toast.error('Failed to create role');
        }
    };

    const handleUpdateRole = async () => {
        if (!editingRole) return;

        try {
            await updateRole(editingRole.id, {
                name: formData.name,  // Can be custom string
                description: formData.description,
                isActive: formData.isActive,
                permissions: selectedPermissions  // Update permissions directly
            });

            toast.success('Role updated successfully');
            setDialogOpen(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Failed to update role:', error);
            toast.error('Failed to update role');
        }
    };

    const handleDeleteRole = async (roleId: string) => {
        try {
            await deleteRole(roleId);
            toast.success('Role deleted successfully');
            loadData();
        } catch (error) {
            console.error('Failed to delete role:', error);
            toast.error('Failed to delete role');
        }
    };

    const handleEditRole = async (role: Role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            description: role.description,
            isActive: role.isActive
        });

        // Load current permissions
        try {
            const rolePermissions = await getRolePermissions(role.id);
            setSelectedPermissions(rolePermissions.map(p => p.id));
        } catch (error) {
            console.error('Failed to load role permissions:', error);
        }

        setDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            isActive: true
        });
        setSelectedPermissions([]);
        setEditingRole(null);
    };

    const handlePermissionChange = (permissionId: string, checked: boolean) => {
        if (checked) {
            setSelectedPermissions(prev => [...prev, permissionId]);
        } else {
            setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
        }
    };

    const handleInitializeRBAC = async () => {
        try {
            await initializeDefaultRBAC();
            toast.success('RBAC system initialized successfully');
            loadData();
        } catch (error) {
            console.error('Failed to initialize RBAC:', error);
            toast.error('Failed to initialize RBAC system');
        }
    };

    const getModuleIcon = (module: string) => {
        switch (module) {
            case 'dashboard': return <Eye className="w-4 h-4" />;
            case 'users': return <Users className="w-4 h-4" />;
            case 'tasks': return <Settings className="w-4 h-4" />;
            case 'kras': return <Settings className="w-4 h-4" />;
            case 'teams': return <Users className="w-4 h-4" />;
            case 'reports': return <Settings className="w-4 h-4" />;
            case 'analytics': return <Settings className="w-4 h-4" />;
            case 'notifications': return <Settings className="w-4 h-4" />;
            case 'roles': return <Shield className="w-4 h-4" />;
            case 'permissions': return <Shield className="w-4 h-4" />;
            case 'scoring': return <Settings className="w-4 h-4" />;
            case 'system': return <Shield className="w-4 h-4" />;
            default: return <Settings className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading roles...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Role Management</h1>
                    <p className="text-muted-foreground">Manage roles and their permissions</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger>
                        <Button onClick={resetForm}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Role
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingRole ? 'Edit Role' : 'Create New Role'}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Role Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Enter role name"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="isActive">Status</Label>
                                    <div className="flex items-center space-x-2 mt-2">
                                        <Checkbox
                                            id="isActive"
                                            checked={formData.isActive}
                                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
                                        />
                                        <Label htmlFor="isActive">Active</Label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Enter role description"
                                    rows={3}
                                />
                            </div>

                            {/* Permissions */}
                            <div>
                                <Label className="text-lg font-semibold">Permissions</Label>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Select the permissions this role should have
                                </p>

                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {Object.entries(permissions).map(([module, modulePermissions]) => (
                                        <Card key={module} className="p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                {getModuleIcon(module)}
                                                <h3 className="font-semibold capitalize">{module}</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {modulePermissions.map((permission) => (
                                                    <div key={permission.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={permission.id}
                                                            checked={selectedPermissions.includes(permission.id)}
                                                            onCheckedChange={(checked) => handlePermissionChange(permission.id, !!checked)}
                                                        />
                                                        <Label htmlFor={permission.id} className="text-sm">
                                                            {permission.name}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={editingRole ? handleUpdateRole : handleCreateRole}>
                                    {editingRole ? 'Update Role' : 'Create Role'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map((role) => (
                    <Card key={role.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-primary-600" />
                                    {role.name}
                                </CardTitle>
                                <div className="flex items-center gap-1">
                                    {role.isSystem && (
                                        <Badge variant="secondary" className="text-xs">
                                            System
                                        </Badge>
                                    )}
                                    <Badge variant={role.isActive ? "default" : "secondary"}>
                                        {role.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                        </CardHeader>

                        <CardContent>
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-muted-foreground">
                                    Created {role.createdAt.toLocaleDateString()}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditRole(role)}
                                        disabled={role.isSystem}
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={role.isSystem}
                                            >
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Role</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete the role "{role.name}"?
                                                    This action cannot be undone and will remove this role from all users.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteRole(role.id)}>
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {roles.length === 0 && (
                <Card className="p-8 text-center">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Roles Found</h3>
                    <p className="text-muted-foreground mb-4">
                        Initialize the RBAC system to create default roles and permissions.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button onClick={handleInitializeRBAC}>
                            <Shield className="w-4 h-4 mr-2" />
                            Initialize RBAC System
                        </Button>
                        <Button variant="outline" onClick={() => setDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Custom Role
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
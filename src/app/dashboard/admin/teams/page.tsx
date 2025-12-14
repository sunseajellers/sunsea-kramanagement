// src/app/dashboard/admin/teams/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { getAllTeams, updateTeam, deleteTeam, createTeam, bulkUpdateTeams } from '@/lib/teamService';
import { getAllUsers } from '@/lib/userService';
import { Team, User } from '@/types';
import { Loader2, Plus, Search, Users, Trash2, Edit, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';

interface TeamFormData {
    name: string;
    description: string;
    managerId: string;
    parentId: string;
    memberIds: string[];
}

export default function AdminTeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());

    // Dialog states
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

    // Form state
    const [teamForm, setTeamForm] = useState<TeamFormData>({
        name: '',
        description: '',
        managerId: '',
        parentId: '',
        memberIds: []
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [teamsData, usersData] = await Promise.all([
                getAllTeams(),
                getAllUsers()
            ]);
            setTeams(teamsData);
            setUsers(usersData);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Filtered teams
    const filteredTeams = useMemo(() => {
        return teams.filter(team =>
            team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            team.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [teams, searchTerm]);

    const handleCreateTeam = async () => {
        try {
            await createTeam({
                name: teamForm.name,
                description: teamForm.description,
                managerId: teamForm.managerId,
                parentId: teamForm.parentId || undefined,
                memberIds: teamForm.memberIds
            });
            toast.success('Team created successfully');
            setCreateDialogOpen(false);
            resetForm();
            loadData();
        } catch (error) {
            toast.error('Failed to create team');
        }
    };

    const handleUpdateTeam = async () => {
        if (!selectedTeam) return;

        try {
            await updateTeam(selectedTeam.id, {
                name: teamForm.name,
                description: teamForm.description,
                managerId: teamForm.managerId,
                parentId: teamForm.parentId || undefined,
                memberIds: teamForm.memberIds
            });
            toast.success('Team updated successfully');
            setEditDialogOpen(false);
            resetForm();
            loadData();
        } catch (error) {
            toast.error('Failed to update team');
        }
    };

    const handleDeleteTeam = async () => {
        if (!selectedTeam) return;

        try {
            await deleteTeam(selectedTeam.id);
            toast.success('Team deleted successfully');
            setDeleteDialogOpen(false);
            setSelectedTeam(null);
            loadData();
        } catch (error) {
            toast.error('Failed to delete team');
        }
    };

    const handleBulkAction = async (action: 'delete' | 'activate' | 'deactivate') => {
        if (selectedTeams.size === 0) return;

        try {
            const teamIds = Array.from(selectedTeams);
            const updates: Partial<Team> = {};

            switch (action) {
                case 'delete':
                    for (const teamId of teamIds) {
                        await deleteTeam(teamId);
                    }
                    toast.success(`Deleted ${teamIds.length} teams`);
                    break;
                case 'activate':
                    updates.isActive = true;
                    await bulkUpdateTeams(teamIds, updates);
                    toast.success(`Activated ${teamIds.length} teams`);
                    break;
                case 'deactivate':
                    updates.isActive = false;
                    await bulkUpdateTeams(teamIds, updates);
                    toast.success(`Deactivated ${teamIds.length} teams`);
                    break;
            }

            setSelectedTeams(new Set());
            loadData();
        } catch (error) {
            toast.error('Bulk operation failed');
        }
    };

    const resetForm = () => {
        setTeamForm({
            name: '',
            description: '',
            managerId: '',
            parentId: '',
            memberIds: []
        });
    };

    const openEditDialog = (team: Team) => {
        setSelectedTeam(team);
        setTeamForm({
            name: team.name,
            description: team.description || '',
            managerId: team.managerId,
            parentId: team.parentId || '',
            memberIds: team.memberIds || []
        });
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (team: Team) => {
        setSelectedTeam(team);
        setDeleteDialogOpen(true);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedTeams(new Set(filteredTeams.map(t => t.id)));
        } else {
            setSelectedTeams(new Set());
        }
    };

    const handleSelectTeam = (teamId: string, checked: boolean) => {
        const newSelected = new Set(selectedTeams);
        if (checked) {
            newSelected.add(teamId);
        } else {
            newSelected.delete(teamId);
        }
        setSelectedTeams(newSelected);
    };

    const getManagerName = (managerId: string) => {
        const manager = users.find(u => u.id === managerId);
        return manager ? manager.fullName : 'Unknown';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="h-6 w-6" />
                    Team Management
                </h1>
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Team
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Teams</p>
                                <p className="text-2xl font-bold">{teams.length}</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Active Teams</p>
                                <p className="text-2xl font-bold">{teams.filter(t => t.isActive !== false).length}</p>
                            </div>
                            <Users className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Avg Team Size</p>
                                <p className="text-2xl font-bold">
                                    {teams.length > 0 ? Math.round(teams.reduce((acc, t) => acc + (t.memberIds?.length || 0), 0) / teams.length) : 0}
                                </p>
                            </div>
                            <Users className="h-8 w-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Sub-teams</p>
                                <p className="text-2xl font-bold">{teams.filter(t => t.parentId).length}</p>
                            </div>
                            <Users className="h-8 w-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search teams..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedTeams.size > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                    {selectedTeams.size} team{selectedTeams.size !== 1 ? 's' : ''} selected
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBulkAction('activate')}
                                >
                                    Activate
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBulkAction('deactivate')}
                                >
                                    Deactivate
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleBulkAction('delete')}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Selected
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Teams List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Teams ({filteredTeams.length})</CardTitle>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={selectedTeams.size === filteredTeams.length && filteredTeams.length > 0}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                            />
                            <span className="text-sm text-muted-foreground">Select All</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {filteredTeams.map((team) => (
                            <div
                                key={team.id}
                                className={`flex items-center justify-between p-4 border rounded-lg ${
                                    selectedTeams.has(team.id) ? 'bg-blue-50 border-blue-200' : 'bg-white'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedTeams.has(team.id)}
                                        onChange={(e) => handleSelectTeam(team.id, e.target.checked)}
                                    />
                                    <div>
                                        <h3 className="font-medium">{team.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="secondary" className="text-xs">
                                                Manager: {getManagerName(team.managerId)}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {team.memberIds?.length || 0} members
                                            </Badge>
                                            {team.parentId && (
                                                <Badge variant="outline" className="text-xs">
                                                    Has parent
                                                </Badge>
                                            )}
                                            {team.isActive === false && (
                                                <Badge variant="secondary">Inactive</Badge>
                                            )}
                                        </div>
                                        {team.description && (
                                            <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditDialog(team)}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedTeam(team);
                                            setTeamForm({
                                                name: `${team.name} (Copy)`,
                                                description: team.description || '',
                                                managerId: team.managerId,
                                                parentId: team.parentId || '',
                                                memberIds: team.memberIds || []
                                            });
                                            setCreateDialogOpen(true);
                                        }}
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Duplicate
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => openDeleteDialog(team)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Create Team Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create New Team</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Team Name</label>
                            <Input
                                value={teamForm.name}
                                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                                placeholder="Enter team name"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                value={teamForm.description}
                                onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                                placeholder="Enter team description"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Manager</label>
                            <select
                                value={teamForm.managerId}
                                onChange={(e) => setTeamForm({ ...teamForm, managerId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select manager</option>
                                {users.filter(u => u.role === 'manager').map(manager => (
                                    <option key={manager.id} value={manager.id}>
                                        {manager.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Parent Team (Optional)</label>
                            <select
                                value={teamForm.parentId}
                                onChange={(e) => setTeamForm({ ...teamForm, parentId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">No parent</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateTeam}>
                                Create Team
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Team Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Team</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Team Name</label>
                            <Input
                                value={teamForm.name}
                                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                                placeholder="Enter team name"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                value={teamForm.description}
                                onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                                placeholder="Enter team description"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Manager</label>
                            <select
                                value={teamForm.managerId}
                                onChange={(e) => setTeamForm({ ...teamForm, managerId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select manager</option>
                                {users.filter(u => u.role === 'manager').map(manager => (
                                    <option key={manager.id} value={manager.id}>
                                        {manager.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Parent Team (Optional)</label>
                            <select
                                value={teamForm.parentId}
                                onChange={(e) => setTeamForm({ ...teamForm, parentId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">No parent</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateTeam}>
                                Update Team
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Team</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p>
                            Are you sure you want to delete the team <strong>{selectedTeam?.name}</strong>?
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteTeam}>
                                Delete
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

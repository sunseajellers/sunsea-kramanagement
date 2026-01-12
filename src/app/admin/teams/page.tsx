// src/app/admin/teams/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { getAllTeams, updateTeam, deleteTeam, createTeam, bulkUpdateTeams } from '@/lib/teamService';
import { getAllUsers } from '@/lib/userService';
import { Team, User } from '@/types';
import { Loader2, Plus, Search, Users, Trash2, Edit, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Organizational Units</h1>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Users className="h-3 w-3 text-blue-500" />
                        Team structure & hierarchy management
                    </p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)} className="h-11 px-8 rounded-xl bg-gray-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Initialize Team
                </Button>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Units', value: teams.length, icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-50' },
                    { label: 'Live Protocols', value: teams.filter(t => t.isActive !== false).length, icon: Users, color: 'text-green-500', bgColor: 'bg-green-50' },
                    { label: 'Avg Density', value: teams.length > 0 ? Math.round(teams.reduce((acc, t) => acc + (t.memberIds?.length || 0), 0) / teams.length) : 0, icon: Users, color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
                    { label: 'Sub-Structures', value: teams.filter(t => t.parentId).length, icon: Users, color: 'text-amber-500', bgColor: 'bg-amber-50' }
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ${stat.color}`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{stat.label}</p>
                            <h3 className="text-2xl font-black text-gray-900 mt-1 uppercase tracking-tighter">{stat.value}</h3>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Search - Simplified */}
            <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search teams..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 border-gray-100 bg-gray-50/50"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Bulk Actions - Simplified */}
            {selectedTeams.size > 0 && (
                <div className="bg-blue-600 rounded-xl p-4 flex items-center justify-between shadow-lg text-white">
                    <div className="flex items-center gap-3">
                        <Users className="h-5 w-5" />
                        <span className="text-sm font-black uppercase tracking-widest">
                            {selectedTeams.size} team{selectedTeams.size !== 1 ? 's' : ''} selected
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 text-[10px] font-black uppercase tracking-widest"
                            onClick={() => handleBulkAction('activate')}
                        >
                            Activate
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 text-[10px] font-black uppercase tracking-widest"
                            onClick={() => handleBulkAction('deactivate')}
                        >
                            Deactivate
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 text-[10px] font-black uppercase tracking-widest bg-red-500 hover:bg-red-600 border-none"
                            onClick={() => handleBulkAction('delete')}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            )}

            {/* Teams List - Simplified */}
            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="border-b bg-gray-50/30 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">Teams ({filteredTeams.length})</CardTitle>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={selectedTeams.size === filteredTeams.length && filteredTeams.length > 0}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select All</span>
                        </div>
                    </div>
                </CardHeader>
                <div className="divide-y divide-gray-50">
                    {filteredTeams.map((team) => (
                        <div
                            key={team.id}
                            className={`flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors ${selectedTeams.has(team.id) ? 'bg-blue-50/30' : ''
                                }`}
                        >
                            <div className="flex items-center gap-5">
                                <input
                                    type="checkbox"
                                    checked={selectedTeams.has(team.id)}
                                    onChange={(e) => handleSelectTeam(team.id, e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div>
                                    <h3 className="font-bold text-gray-900">{team.name}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-tighter border border-blue-100">
                                            Manager: {getManagerName(team.managerId)}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-tighter border border-gray-100">
                                            {team.memberIds?.length || 0} members
                                        </span>
                                        {team.parentId && (
                                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-tighter border border-amber-100">
                                                Nested
                                            </span>
                                        )}
                                        {team.isActive === false && (
                                            <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-tighter border border-red-100">
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                    {team.description && (
                                        <p className="text-xs text-gray-400 font-medium mt-2 max-w-lg">{team.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 hover:bg-blue-50"
                                    onClick={() => openEditDialog(team)}
                                >
                                    <Edit className="h-3.5 w-3.5 mr-2" />
                                    Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-600 hover:bg-indigo-50"
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
                                    <Copy className="h-3.5 w-3.5 mr-2" />
                                    Copy
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-gray-300 hover:text-red-500 hover:bg-red-50"
                                    onClick={() => openDeleteDialog(team)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
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
                                {users.map(manager => (
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
                                {users.map(manager => (
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

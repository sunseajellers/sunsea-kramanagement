'use client';

import { useEffect, useState, useMemo } from 'react';
import { getAllTeams, updateTeam, deleteTeam, createTeam, bulkUpdateTeams } from '@/lib/teamService';
import { getAllUsers } from '@/lib/userService';
import { Team, User } from '@/types';
import { Plus, Search, Users, Trash2, Edit, Copy, ChevronLeft, ChevronRight, Shield, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const ITEMS_PER_PAGE = 6;

export default function TeamManagement() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);

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

    // Pagination
    const totalPages = Math.ceil(filteredTeams.length / ITEMS_PER_PAGE);
    const paginatedTeams = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTeams.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredTeams, currentPage]);

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

    const getManagerName = (managerId: string) => {
        const manager = users.find(u => u.id === managerId);
        return manager ? manager.fullName : 'Unknown';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center animate-pulse">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Loading teams...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Organizational Structure</h2>
                    <p className="text-gray-400 text-xs font-medium">Manage teams, labels and hierarchy</p>
                </div>
                <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="bg-gray-900 hover:bg-black h-9 px-4 rounded-xl font-semibold text-xs"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Team
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Teams', value: teams.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Active', value: teams.filter(t => t.isActive !== false).length, icon: Shield, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Avg Members', value: teams.length > 0 ? Math.round(teams.reduce((acc, t) => acc + (t.memberIds?.length || 0), 0) / teams.length) : 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Sub-teams', value: teams.filter(t => t.parentId).length, icon: GitBranch, color: 'text-amber-600', bg: 'bg-amber-50' }
                ].map((stat, i) => (
                    <div key={i} className="stat-card">
                        <div className="flex flex-col gap-0.5">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                        </div>
                        <div className={`icon-box icon-box-md ${stat.bg} ${stat.color}`}>
                            <stat.icon className="h-5 w-5" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Bulk Actions */}
            <div className="glass-card p-3 flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <Input
                        placeholder="Search teams..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="pl-10 h-9 border-none bg-gray-50/50 rounded-lg text-sm"
                    />
                </div>
                {selectedTeams.size > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">{selectedTeams.size} selected</span>
                        <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')} className="h-8 text-xs rounded-lg">
                            Activate
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')} className="h-8 text-xs rounded-lg">
                            Deactivate
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')} className="h-8 text-xs rounded-lg">
                            Delete
                        </Button>
                    </div>
                )}
            </div>

            {/* Teams Grid */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="scroll-panel flex-1 pr-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedTeams.length > 0 ? (
                            paginatedTeams.map((team) => (
                                <div
                                    key={team.id}
                                    className={`module-card group cursor-pointer ${selectedTeams.has(team.id) ? 'ring-2 ring-purple-200' : ''}`}
                                    onClick={() => {
                                        const newSelected = new Set(selectedTeams);
                                        if (newSelected.has(team.id)) {
                                            newSelected.delete(team.id);
                                        } else {
                                            newSelected.add(team.id);
                                        }
                                        setSelectedTeams(newSelected);
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="icon-box icon-box-md bg-indigo-50 text-indigo-600">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 rounded-lg"
                                                onClick={(e) => { e.stopPropagation(); openEditDialog(team); }}
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 rounded-lg"
                                                onClick={(e) => {
                                                    e.stopPropagation();
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
                                                <Copy className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={(e) => { e.stopPropagation(); openDeleteDialog(team); }}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-bold text-gray-900 mb-1">{team.name}</h3>
                                    {team.description && (
                                        <p className="text-[11px] text-gray-400 line-clamp-2 mb-3">{team.description}</p>
                                    )}

                                    <div className="flex flex-wrap gap-1.5 mt-auto">
                                        <span className="badge badge-info">
                                            {getManagerName(team.managerId)}
                                        </span>
                                        <span className="badge badge-neutral">
                                            {team.memberIds?.length || 0} members
                                        </span>
                                        {team.parentId && (
                                            <span className="badge badge-warning">Nested</span>
                                        )}
                                        {team.isActive === false && (
                                            <span className="badge badge-danger">Inactive</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full">
                                <div className="empty-state">
                                    <div className="empty-state-icon">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <p className="empty-state-title">No teams found</p>
                                    <p className="empty-state-description">Create your first team to get started</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100">
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
                                const page = i + 1;
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
                                );
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

            {/* Create Team Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-none rounded-2xl">
                    <DialogHeader className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 text-white">
                        <DialogTitle className="text-lg font-bold">Create Team</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500">Team Name</label>
                            <Input
                                value={teamForm.name}
                                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                                placeholder="Enter team name"
                                className="h-10 rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500">Description</label>
                            <Textarea
                                value={teamForm.description}
                                onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                                placeholder="Team description"
                                className="rounded-xl resize-none h-20"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500">Manager</label>
                            <select
                                value={teamForm.managerId}
                                onChange={(e) => setTeamForm({ ...teamForm, managerId: e.target.value })}
                                className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                            >
                                <option value="">Select manager</option>
                                {users.map(manager => (
                                    <option key={manager.id} value={manager.id}>
                                        {manager.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500">Parent Team (Optional)</label>
                            <select
                                value={teamForm.parentId}
                                onChange={(e) => setTeamForm({ ...teamForm, parentId: e.target.value })}
                                className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                            >
                                <option value="">No parent</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="flex-1 h-10 rounded-xl">
                                Cancel
                            </Button>
                            <Button onClick={handleCreateTeam} className="flex-1 h-10 bg-purple-600 hover:bg-purple-700 rounded-xl">
                                Create Team
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Team Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-none rounded-2xl">
                    <DialogHeader className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 text-white">
                        <DialogTitle className="text-lg font-bold">Edit Team</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500">Team Name</label>
                            <Input
                                value={teamForm.name}
                                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                                className="h-10 rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500">Description</label>
                            <Textarea
                                value={teamForm.description}
                                onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                                className="rounded-xl resize-none h-20"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500">Manager</label>
                            <select
                                value={teamForm.managerId}
                                onChange={(e) => setTeamForm({ ...teamForm, managerId: e.target.value })}
                                className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                            >
                                <option value="">Select manager</option>
                                {users.map(manager => (
                                    <option key={manager.id} value={manager.id}>
                                        {manager.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1 h-10 rounded-xl">
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateTeam} className="flex-1 h-10 bg-purple-600 hover:bg-purple-700 rounded-xl">
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[360px] border-none rounded-2xl">
                    <div className="text-center py-4">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
                            <Trash2 className="h-7 w-7 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Team?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Are you sure you want to delete <strong>{selectedTeam?.name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="flex-1 h-10 rounded-xl">
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteTeam} className="flex-1 h-10 rounded-xl">
                                Delete
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

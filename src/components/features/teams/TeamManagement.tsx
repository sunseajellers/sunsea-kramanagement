'use client';

import { useEffect, useState, useMemo } from 'react';
import { getAllTeams, updateTeam, deleteTeam, createTeam, bulkUpdateTeams } from '@/lib/teamService';
import { getAllUsers } from '@/lib/userService';
import { Team, User } from '@/types';
import { Plus, Search, Users, Trash2, Edit, Copy, ChevronLeft, ChevronRight, Shield, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
        <div className="space-y-10 animate-in">
            {/* Header */}
            <div className="page-header flex items-center justify-between">
                <div>
                    <h2 className="section-title">Team Hierarchy</h2>
                    <p className="section-subtitle">Manage organizational units, member assignments, and reporting structures</p>
                </div>
                <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="btn-primary h-12"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Assemble Team
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Units', value: teams.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
                    { label: 'Active Teams', value: teams.filter(t => t.isActive !== false).length, icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
                    { label: 'Avg Force Size', value: teams.length > 0 ? Math.round(teams.reduce((acc, t) => acc + (t.memberIds?.length || 0), 0) / teams.length) : 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50/50' },
                    { label: 'Sub-Structures', value: teams.filter(t => t.parentId).length, icon: GitBranch, color: 'text-amber-600', bg: 'bg-amber-50/50' }
                ].map((stat, i) => (
                    <div key={i} className="dashboard-card border-none">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                                <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
                            </div>
                            <div className={cn("p-2.5 rounded-2xl shadow-sm", stat.bg, stat.color)}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Bulk Actions */}
            <div className="glass-panel p-4 flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input
                        placeholder="Search teams by name or description..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="form-input pl-12 h-12 bg-slate-50/50 border-none shadow-none"
                    />
                </div>
                {selectedTeams.size > 0 && (
                    <div className="flex items-center gap-2 p-1 bg-slate-100/50 rounded-2xl border border-slate-200/60">
                        <span className="text-[10px] font-black uppercase text-slate-400 px-3">{selectedTeams.size} selected</span>
                        <Button size="sm" variant="ghost" onClick={() => handleBulkAction('activate')} className="h-9 px-4 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl">
                            Activate
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleBulkAction('deactivate')} className="h-9 px-4 text-xs font-bold text-amber-600 hover:bg-amber-50 rounded-xl">
                            Suspend
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleBulkAction('delete')} className="h-9 px-4 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl">
                            Disband
                        </Button>
                    </div>
                )}
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                {paginatedTeams.length > 0 ? (
                    paginatedTeams.map((team) => (
                        <div
                            key={team.id}
                            onClick={() => {
                                const newSelected = new Set(selectedTeams);
                                if (newSelected.has(team.id)) {
                                    newSelected.delete(team.id);
                                } else {
                                    newSelected.add(team.id);
                                }
                                setSelectedTeams(newSelected);
                            }}
                            className={cn(
                                "glass-panel-hover p-6 flex flex-col cursor-pointer group relative overflow-hidden",
                                selectedTeams.has(team.id) ? 'ring-2 ring-indigo-500 border-indigo-200' : ''
                            )}
                        >
                            {/* Selected Indicator */}
                            {selectedTeams.has(team.id) && (
                                <div className="absolute top-0 right-0 p-3">
                                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-white shadow-lg">
                                        <Shield className="w-3 h-3 text-white" />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-6">
                                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-2 group-hover:translate-y-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl hover:bg-white/80 shadow-sm"
                                        onClick={(e) => { e.stopPropagation(); openEditDialog(team); }}
                                    >
                                        <Edit className="h-4 w-4 text-slate-600" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl hover:bg-white/80 shadow-sm"
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
                                        <Copy className="h-4 w-4 text-slate-600" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl hover:bg-rose-50 text-rose-500 shadow-sm"
                                        onClick={(e) => { e.stopPropagation(); openDeleteDialog(team); }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{team.name}</h3>
                            {team.description && (
                                <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-6 leading-relaxed">{team.description}</p>
                            )}

                            <div className="mt-auto space-y-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
                                        <Shield className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Director</span>
                                        <span className="text-xs font-bold text-slate-900">{getManagerName(team.managerId)}</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <span className="status-badge status-badge-info">
                                        {team.memberIds?.length || 0} Members
                                    </span>
                                    {team.parentId && (
                                        <span className="status-badge status-badge-warning">
                                            Sub-Team
                                        </span>
                                    )}
                                    <span className={cn(
                                        "status-badge",
                                        team.isActive !== false ? "status-badge-success" : "status-badge-danger"
                                    )}>
                                        {team.isActive !== false ? 'Operational' : 'Suspended'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center">
                                <Users className="w-10 h-10 text-slate-200" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-black text-slate-400">Tactical Units Not Found</p>
                                <p className="text-sm text-slate-400 font-medium">Reset filters or initialize a new team structure</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 mt-8 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-9 w-9 rounded-xl hover:bg-slate-100"
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
                                    className={cn(
                                        "h-9 w-9 rounded-xl text-xs font-bold transition-all",
                                        currentPage === page ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-500 hover:bg-slate-50"
                                    )}
                                >
                                    {page}
                                </Button>
                            );
                        })}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="h-9 w-9 rounded-xl hover:bg-slate-100"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
            {/* Create Team Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 px-8 py-10 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Users className="w-24 h-24" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Create Team</h2>
                        <p className="text-indigo-100 text-sm font-medium mt-1 uppercase tracking-widest opacity-80">Assemble a new unit</p>
                    </div>

                    <div className="p-8 space-y-6 bg-white">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Team Identity *</label>
                            <Input
                                value={teamForm.name}
                                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                                placeholder="e.g. Design Operations"
                                className="form-input"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mission / Description</label>
                            <Textarea
                                value={teamForm.description}
                                onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                                placeholder="Describe the unit's core objectives..."
                                className="form-input min-h-[100px] py-3 resize-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Lead Manager</label>
                                <select
                                    value={teamForm.managerId}
                                    onChange={(e) => setTeamForm({ ...teamForm, managerId: e.target.value })}
                                    className="form-input"
                                >
                                    <option value="">Select Lead</option>
                                    {users.map(manager => (
                                        <option key={manager.id} value={manager.id}>
                                            {manager.fullName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Parent Hierarchy</label>
                                <select
                                    value={teamForm.parentId}
                                    onChange={(e) => setTeamForm({ ...teamForm, parentId: e.target.value })}
                                    className="form-input"
                                >
                                    <option value="">Independent</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.id}>
                                            {team.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Button variant="ghost" onClick={() => setCreateDialogOpen(false)} className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:bg-slate-50">
                                Cancel
                            </Button>
                            <Button onClick={handleCreateTeam} className="btn-primary flex-1 h-14">
                                Confirm Unit
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Team Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 px-8 py-10 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Edit className="w-24 h-24" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Edit Unit</h2>
                        <p className="text-indigo-100 text-sm font-medium mt-1 uppercase tracking-widest opacity-80">Modify team configurations</p>
                    </div>

                    <div className="p-8 space-y-6 bg-white">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Team Identity</label>
                            <Input
                                value={teamForm.name}
                                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                                className="form-input"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mission / Description</label>
                            <Textarea
                                value={teamForm.description}
                                onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                                className="form-input min-h-[100px] py-3 resize-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Lead Manager</label>
                            <select
                                value={teamForm.managerId}
                                onChange={(e) => setTeamForm({ ...teamForm, managerId: e.target.value })}
                                className="form-input"
                            >
                                <option value="">Select Lead</option>
                                {users.map(manager => (
                                    <option key={manager.id} value={manager.id}>
                                        {manager.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Button variant="ghost" onClick={() => setEditDialogOpen(false)} className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:bg-slate-50">
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateTeam} className="btn-primary flex-1 h-14">
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl">
                    <div className="p-10 text-center space-y-6">
                        <div className="w-20 h-20 mx-auto rounded-[2rem] bg-rose-50 flex items-center justify-center">
                            <Trash2 className="h-10 w-10 text-rose-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 leading-tight">Disband Team?</h3>
                            <p className="text-sm text-slate-500 font-medium">
                                Are you sure you want to delete <strong>{selectedTeam?.name}</strong>? This action cannot be undone and will affect hierarchical reporting.
                            </p>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:bg-slate-50">
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteTeam} className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest">
                                Confirm Disband
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

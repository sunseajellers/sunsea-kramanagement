'use client';

import { useEffect, useState, useMemo } from 'react';
import { getAllTeams, updateTeam, deleteTeam, createTeam, bulkUpdateTeams } from '@/lib/teamService';
import { getAllUsers } from '@/lib/userService';
import { Team, User } from '@/types';
import { Plus, Search, Users, Trash2, Edit, Copy, ChevronLeft, ChevronRight, Shield, GitBranch, Loader2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,

    DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
            <div className="flex flex-col items-center justify-center py-32 gap-6">
                <Loader2 className="w-14 h-14 animate-spin text-primary/40" />
                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Loading teams...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in">
            {/* Header */}
            <div className="page-header flex items-center justify-between">
                <div>
                    <h2 className="section-title">Staff Teams</h2>
                    <p className="section-subtitle">Manage your staff groups, team leaders, and who reports to whom</p>
                </div>
                <button
                    onClick={() => setCreateDialogOpen(true)}
                    className="btn-primary h-14 px-8"
                >
                    <Plus className="h-5 w-5 mr-3" />
                    Create New Team
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                    { label: 'Total Teams', value: teams.length, icon: Users, color: 'text-primary', bg: 'bg-primary/5' },
                    { label: 'Active Teams', value: teams.filter(t => t.isActive !== false).length, icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
                    { label: 'Avg Team Size', value: teams.length > 0 ? Math.round(teams.reduce((acc, t) => acc + (t.memberIds?.length || 0), 0) / teams.length) : 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50/50' },
                    { label: 'Sub-Teams', value: teams.filter(t => t.parentId).length, icon: GitBranch, color: 'text-amber-600', bg: 'bg-amber-50/50' }
                ].map((stat, i) => (
                    <div key={i} className="dashboard-card border-none bg-white p-8 group">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] leading-none mb-1">{stat.label}</p>
                                <h3 className="text-4xl font-black text-primary transition-colors group-hover:text-secondary">{stat.value}</h3>
                            </div>
                            <div className={cn("p-4 rounded-[1.5rem] shadow-sm transition-transform group-hover:scale-110 duration-500", stat.bg, stat.color)}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Bulk Actions */}
            <div className="glass-panel p-8 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 relative w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                    <Input
                        placeholder="Search for a team by name..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="form-input pl-14 h-14 bg-muted/20 border-none shadow-none"
                    />
                </div>
                {selectedTeams.size > 0 && (
                    <div className="flex items-center gap-4 p-2 bg-white rounded-2xl border border-border/50 shadow-sm">
                        <span className="text-[10px] font-black uppercase text-muted-foreground/60 px-4">{selectedTeams.size} selected</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleBulkAction('activate')} className="h-10 px-5 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors">
                                Activate
                            </button>
                            <button onClick={() => handleBulkAction('deactivate')} className="h-10 px-5 text-[10px] font-black uppercase tracking-widest text-amber-600 hover:bg-amber-50 rounded-xl transition-colors">
                                Suspend
                            </button>
                            <button onClick={() => handleBulkAction('delete')} className="h-10 px-5 text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/5 rounded-xl transition-colors">
                                Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-16">
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
                                "glass-panel p-0 flex flex-col cursor-pointer group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-border/40",
                                selectedTeams.has(team.id) ? 'ring-2 ring-primary border-primary/20 bg-primary/5' : ''
                            )}
                        >
                            <div className="p-10 flex flex-col h-full">
                                {/* Actions Overlay */}
                                <div className="absolute top-8 right-8 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                                    <button
                                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-xl border border-border hover:text-primary transition-all"
                                        onClick={(e) => { e.stopPropagation(); openEditDialog(team); }}
                                        title="Edit Team"
                                    >
                                        <Edit className="h-5 w-5" />
                                    </button>
                                    <button
                                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-xl border border-border hover:text-primary transition-all"
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
                                        title="Copy Team"
                                    >
                                        <Copy className="h-5 w-5" />
                                    </button>
                                    <button
                                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-xl border border-border hover:text-destructive transition-all"
                                        onClick={(e) => { e.stopPropagation(); openDeleteDialog(team); }}
                                        title="Delete Team"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="mb-8">
                                    <div className="w-16 h-16 rounded-[1.75rem] bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/20 group-hover:bg-secondary transition-all duration-500 group-hover:scale-110 mb-6">
                                        <Users className="h-7 w-7" />
                                    </div>
                                    <h3 className="text-2xl font-black text-primary mb-3 leading-tight transition-colors uppercase tracking-tight group-hover:text-secondary">{team.name}</h3>
                                    {team.description && (
                                        <p className="text-sm text-muted-foreground/70 font-medium line-clamp-2 leading-relaxed italic">{team.description}</p>
                                    )}
                                </div>

                                <div className="mt-auto space-y-6 pt-8 border-t border-border/20">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-muted/40 flex items-center justify-center border border-border/50 group-hover:border-secondary/30 transition-colors">
                                            <Shield className="w-5 h-5 text-secondary" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] leading-none mb-1.5">Team Manager</span>
                                            <span className="text-xs font-black text-primary uppercase tracking-tight">{getManagerName(team.managerId)}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <span className="status-badge bg-primary/5 text-primary border-primary/10">
                                            {team.memberIds?.length || 0} Members
                                        </span>
                                        {team.parentId && (
                                            <span className="status-badge bg-secondary/10 text-secondary border-secondary/20">
                                                Sub-Team
                                            </span>
                                        )}
                                        <span className={cn(
                                            "status-badge",
                                            team.isActive !== false ? "status-badge-success" : "status-badge-danger"
                                        )}>
                                            {team.isActive !== false ? 'ACTIVE' : 'SUSPENDED'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-32 text-center">
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-24 h-24 rounded-[3.5rem] bg-muted flex items-center justify-center">
                                <Users className="w-10 h-10 text-muted-foreground/20" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-black text-primary/30 uppercase tracking-tight">No teams found</p>
                                <p className="text-sm text-muted-foreground/40 font-medium">Try a different search or create a new team</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-10 py-8 border-t border-border/20 bg-muted/20">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
                        Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-white border border-transparent hover:border-border disabled:opacity-20 transition-all font-bold"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = i + 1;
                            return (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-12 w-12 rounded-2xl text-xs font-black transition-all",
                                        currentPage === page ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-muted-foreground hover:bg-white border border-transparent hover:border-border"
                                    )}
                                >
                                    {page}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-white border border-transparent hover:border-border disabled:opacity-20 transition-all font-bold"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            )}

            {/* Create Team Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-sm border border-primary/10">
                                <Users className="w-8 h-8" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">New Collaboration Team</DialogTitle>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Establish a Group for Project Execution</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={(e) => { e.preventDefault(); handleCreateTeam(); }} className="space-y-10 py-6">
                        {/* Team Identity Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-8 w-1 bg-primary rounded-full transition-all" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Team Branding</h3>
                            </div>

                            <div className="grid gap-2.5">
                                <Label htmlFor="teamName" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Team Name *</Label>
                                <Input
                                    id="teamName"
                                    value={teamForm.name}
                                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                                    placeholder="e.g. Creative Design Lab"
                                    className="h-12 bg-slate-50/50 border-slate-100"
                                    required
                                />
                            </div>

                            <div className="grid gap-2.5">
                                <Label htmlFor="description" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Mission Statement / Description</Label>
                                <Textarea
                                    id="description"
                                    value={teamForm.description}
                                    onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                                    placeholder="Briefly define what this team aims to achieve..."
                                    className="min-h-[120px] py-4 resize-none bg-slate-50/50 border-slate-100"
                                />
                            </div>
                        </div>

                        {/* Hierarchy Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-8 w-1 bg-secondary rounded-full transition-all" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Command & Hierarchy</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="grid gap-2.5">
                                    <Label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Team Commander / Manager</Label>
                                    <Select
                                        value={teamForm.managerId}
                                        onValueChange={(v) => setTeamForm({ ...teamForm, managerId: v })}
                                    >
                                        <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100">
                                            <SelectValue placeholder="Select Manager" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map(manager => (
                                                <SelectItem key={manager.id} value={manager.id}>
                                                    {manager.fullName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2.5">
                                    <Label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Upstream / Parent Team</Label>
                                    <Select
                                        value={teamForm.parentId}
                                        onValueChange={(v) => setTeamForm({ ...teamForm, parentId: v })}
                                    >
                                        <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100">
                                            <SelectValue placeholder="Independent Entity" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Independent / Global</SelectItem>
                                            {teams.map(team => (
                                                <SelectItem key={team.id} value={team.id}>
                                                    {team.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-8 border-t border-slate-100">
                            <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} className="h-12 px-8 rounded-2xl font-bold uppercase tracking-widest text-[10px]">
                                Cancel
                            </Button>
                            <Button type="submit" className="h-12 px-10 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">
                                <Plus className="w-5 h-5 mr-3" />
                                Establish Team
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Team Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-sm border border-primary/10">
                                <Edit className="w-8 h-8" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Modify Team</DialogTitle>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Update Settings & Leadership</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={(e) => { e.preventDefault(); handleUpdateTeam(); }} className="space-y-10 py-6">
                        {/* Team Identity Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-8 w-1 bg-primary rounded-full transition-all" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Core Identity</h3>
                            </div>

                            <div className="grid gap-2.5">
                                <Label htmlFor="editTeamName" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Team Name *</Label>
                                <Input
                                    id="editTeamName"
                                    value={teamForm.name}
                                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                                    className="h-12 bg-slate-50/50 border-slate-100"
                                    required
                                />
                            </div>

                            <div className="grid gap-2.5">
                                <Label htmlFor="editDescription" className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Description</Label>
                                <Textarea
                                    id="editDescription"
                                    value={teamForm.description}
                                    onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                                    className="min-h-[120px] py-4 resize-none bg-slate-50/50 border-slate-100"
                                />
                            </div>
                        </div>

                        {/* Management Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-8 w-1 bg-secondary rounded-full transition-all" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Leadership Role</h3>
                            </div>

                            <div className="grid gap-2.5">
                                <Label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Designated Manager</Label>
                                <Select
                                    value={teamForm.managerId}
                                    onValueChange={(v) => setTeamForm({ ...teamForm, managerId: v })}
                                >
                                    <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100">
                                        <SelectValue placeholder="Select Manager" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map(manager => (
                                            <SelectItem key={manager.id} value={manager.id}>
                                                {manager.fullName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter className="pt-8 border-t border-slate-100">
                            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} className="h-12 px-8 rounded-2xl font-bold uppercase tracking-widest text-[10px]">
                                Cancel
                            </Button>
                            <Button type="submit" className="h-12 px-10 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">
                                <Shield className="w-5 h-5 mr-3" />
                                Sync Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[440px]">
                    <div className="p-12 text-center space-y-8">
                        <div className="w-24 h-24 mx-auto rounded-[2.5rem] bg-destructive/5 flex items-center justify-center">
                            <Trash2 className="h-12 w-12 text-destructive" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-3xl font-black text-primary leading-tight uppercase tracking-tight">Delete Team?</h3>
                            <p className="text-base text-muted-foreground/70 font-medium">
                                Are you sure you want to delete <strong>{selectedTeam?.name}</strong>? This cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setDeleteDialogOpen(false)} className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-muted/50 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleDeleteTeam} className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-destructive text-white shadow-xl shadow-destructive/20 active:translate-y-0.5 transition-all">
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

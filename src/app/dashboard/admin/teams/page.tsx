// src/app/dashboard/admin/teams/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getAllTeams, updateTeam, deleteTeam } from '@/lib/teamService';
import { Team } from '@/types';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';

export default function AdminTeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

    const fetchTeams = async () => {
        try {
            const data = await getAllTeams();
            setTeams(data);
        } catch (err) {
            console.error('Failed to load teams', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    const openDeleteConfirm = (team: Team) => {
        setSelectedTeam(team);
        setConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (selectedTeam) {
            await deleteTeam(selectedTeam.id);
            await fetchTeams();
        }
        setConfirmOpen(false);
        setSelectedTeam(null);
    };

    const updateTeamName = async (teamId: string, name: string) => {
        await updateTeam(teamId, { name });
        await fetchTeams();
    };

    const filtered = teams.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
    );
    const pageCount = Math.ceil(filtered.length / itemsPerPage);
    const displayed = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold mb-4">Team Management</h1>
            <div className="flex items-center mb-4">
                <input
                    type="text"
                    placeholder="Search teams..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded mr-4 focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
                <span className="text-sm text-gray-600">
                    Page {page} of {pageCount}
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-xl shadow">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Manager ID</th>
                            <th className="px-4 py-2 text-left">Members Count</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayed.map((t) => (
                            <tr key={t.id} className="border-t">
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        defaultValue={t.name}
                                        onBlur={(e) => updateTeamName(t.id, e.target.value)}
                                        className="w-full border-b focus:outline-none"
                                    />
                                </td>
                                <td className="px-4 py-2">{t.managerId}</td>
                                <td className="px-4 py-2">{t.memberIds?.length ?? 0}</td>
                                <td className="px-4 py-2">
                                    <button
                                        onClick={() => openDeleteConfirm(t)}
                                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-between mt-4">
                <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded bg-primary-600 text-white disabled:opacity-50"
                >
                    Previous
                </button>
                <button
                    onClick={() => setPage((p) => Math.min(p + 1, pageCount))}
                    disabled={page === pageCount}
                    className="px-4 py-2 rounded bg-primary-600 text-white disabled:opacity-50"
                >
                    Next
                </button>
            </div>
            <Modal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                title="Delete Team"
                confirmLabel="Delete"
                onConfirm={handleDelete}
            >
                Are you sure you want to delete team{' '}
                <strong>{selectedTeam?.name}</strong>?
            </Modal>
        </div>
    );
}

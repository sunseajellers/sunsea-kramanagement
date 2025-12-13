// src/app/dashboard/admin/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getAllUsers, updateUser } from '@/lib/userService';
import { User } from '@/types';
import { Loader2 } from 'lucide-react';

import Modal from '@/components/Modal';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const fetchUsers = async () => {
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (err) {
            console.error('Failed to load users', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleAdmin = async (uid: string, current: boolean) => {
        await updateUser(uid, { isAdmin: !current });
        await fetchUsers();
    };

    const updateUserRole = async (uid: string, role: User['role']) => {
        await updateUser(uid, { role });
        await fetchUsers();
    };

    const filtered = users.filter((u) =>
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );
    const pageCount = Math.ceil(filtered.length / itemsPerPage);
    const displayed = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const openConfirm = (user: User) => {
        setSelectedUser(user);
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        if (selectedUser) {
            await toggleAdmin(selectedUser.id, selectedUser.isAdmin);
        }
        setConfirmOpen(false);
        setSelectedUser(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold mb-4">User Management</h1>
            <div className="flex items-center mb-4">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300 mr-4"
                />
                <span className="text-sm text-gray-600">Page {page} of {pageCount}</span>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-xl shadow">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-left">Role</th>
                            <th className="px-4 py-2 text-left">Admin</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayed.map((u) => (
                            <tr key={u.id} className="border-t">
                                <td className="px-4 py-2">{u.fullName}</td>
                                <td className="px-4 py-2">{u.email}</td>
                                <td className="px-4 py-2">
                                    <select
                                        value={u.role}
                                        onChange={(e) => updateUserRole(u.id, e.target.value as any)}
                                        className="rounded border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                                    >
                                        <option value="admin">admin</option>
                                        <option value="manager">manager</option>
                                        <option value="employee">employee</option>
                                    </select>
                                </td>
                                <td className="px-4 py-2">
                                    <button
                                        onClick={() => openConfirm(u)}
                                        className={`px-3 py-1 rounded ${u.isAdmin ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-800'} transition-colors hover:opacity-90`}
                                    >
                                        {u.isAdmin ? 'Yes' : 'No'}
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
                title="Confirm Admin Change"
                confirmLabel="Toggle"
                onConfirm={handleConfirm}
            >
                Are you sure you want to {selectedUser?.isAdmin ? 'remove' : 'grant'} admin rights for{' '}
                <strong>{selectedUser?.fullName}</strong>?
            </Modal>
        </div>
    );
}

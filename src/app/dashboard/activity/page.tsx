// src/app/dashboard/activity/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { TaskUpdate } from '@/types';
import {
    Activity,
    ArrowLeft,
    Calendar,
    FileText,
    Loader2,
    Search
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function ActivityLog() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [updates, setUpdates] = useState<TaskUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'mine'>('mine');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }
        if (user) {
            fetchUpdates();
        }
    }, [user, authLoading, filter]);

    const fetchUpdates = async () => {
        try {
            setLoading(true);
            const token = await user?.getIdToken();
            const params = filter === 'mine' ? `?userId=${user?.uid}` : '';
            const response = await fetch(`/api/tasks/updates${params}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (response.ok) {
                const data = await response.json();
                setUpdates(data.updates || []);
            }
        } catch (error) {
            console.error('Error fetching updates:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUpdates = updates.filter(update => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            update.taskTitle.toLowerCase().includes(query) ||
            update.statusUpdate.toLowerCase().includes(query) ||
            update.userName.toLowerCase().includes(query)
        );
    });

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="p-2 hover:bg-slate-100 rounded-lg transition"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
                                <p className="text-sm text-slate-500">
                                    Track all task status updates and progress
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="glass-card p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        {/* Search */}
                        <div className="relative flex-1 w-full sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search updates..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setFilter('mine')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'mine'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                My Updates
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'all'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    All Updates
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Activity Timeline */}
                {filteredUpdates.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                                <Activity className="w-8 h-8 text-purple-600" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Activity Yet</h3>
                        <p className="text-slate-500">Task updates will appear here as you make progress.</p>
                    </div>
                ) : (
                    <div className="glass-card">
                        <div className="p-4 border-b border-slate-100">
                            <span className="text-sm text-slate-500">{filteredUpdates.length} updates</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {filteredUpdates.map((update, index) => (
                                <div key={update.id || index} className="p-4 hover:bg-slate-50 transition">
                                    <div className="flex items-start gap-4">
                                        {/* Timeline indicator */}
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                                                {update.userName?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            {index < filteredUpdates.length - 1 && (
                                                <div className="w-0.5 h-8 bg-slate-200 mt-2" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-slate-900">{update.userName}</span>
                                                <span className="text-slate-400">•</span>
                                                <span className="text-sm text-slate-500">
                                                    {formatDistanceToNow(new Date(update.timestamp), { addSuffix: true })}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm text-purple-600 font-medium">{update.taskTitle}</span>
                                            </div>

                                            <p className="text-slate-700">{update.statusUpdate}</p>

                                            {update.remarks && (
                                                <p className="text-sm text-slate-500 mt-2 italic">
                                                    Note: {update.remarks}
                                                </p>
                                            )}

                                            {update.revisionDate && (
                                                <div className="flex items-center gap-1 mt-2 text-sm text-amber-600">
                                                    <Calendar className="w-3 h-3" />
                                                    Requested extension to {format(new Date(update.revisionDate), 'MMM d, yyyy')}
                                                </div>
                                            )}
                                        </div>

                                        {/* Timestamp */}
                                        <div className="text-right text-xs text-slate-400">
                                            {format(new Date(update.timestamp), 'MMM d, yyyy')}
                                            <br />
                                            {format(new Date(update.timestamp), 'h:mm a')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

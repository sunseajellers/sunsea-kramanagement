// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Task, TaskStatus, Priority } from '@/types';
import {
    CheckCircle2,
    Calendar,
    Loader2,
    LogOut,
    Plus,
    ClipboardList,
    Square,
    User,
    History,
    Filter,
    Trophy,
    Target,
    BookOpen
} from 'lucide-react';
import { isPast, isToday, differenceInDays, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import TaskForm from '@/components/features/tasks/TaskForm';
import { useDashboardData } from '@/hooks/useDashboardData';
import PerformanceScoreboard from '@/components/features/performance/PerformanceScoreboard';
import OKRList from '@/components/features/okr/OKRList';
import LearningHub from '@/components/features/learning/LearningHub';

const priorityColors: Record<Priority, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    low: 'bg-slate-100 text-slate-600 border-slate-200',
};

const statusColors: Record<TaskStatus, string> = {
    not_started: 'bg-slate-100 text-slate-600',
    assigned: 'bg-purple-100 text-purple-700',
    in_progress: 'bg-blue-100 text-blue-700',
    blocked: 'bg-red-100 text-red-700',
    pending_review: 'bg-amber-100 text-amber-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-slate-200 text-slate-500',
    on_hold: 'bg-yellow-100 text-yellow-700',
    revision_requested: 'bg-pink-100 text-pink-700',
};

const statusLabels: Record<TaskStatus, string> = {
    not_started: 'Not Started',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    blocked: 'Blocked',
    pending_review: 'Pending Review',
    completed: 'Completed',
    cancelled: 'Cancelled',
    on_hold: 'On Hold',
    revision_requested: 'Revision Requested',
};

export default function EmployeeDashboard() {
    const { user, loading: authLoading, signOut } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'tasks' | 'delegated' | 'history' | 'profile' | 'performance' | 'okr' | 'academy'>('tasks');
    const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({ fullName: '', phone: '' });
    const [savingProfile, setSavingProfile] = useState(false);
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [changingPassword, setChangingPassword] = useState(false);
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set());

    // Use optimized data hook
    const { tasks, delegatedTasks, userProfile, loading, setUserProfile, setTasks } = useDashboardData(
        user?.uid,
        () => user?.getIdToken() || Promise.resolve(undefined)
    );

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        // Redirect admin users to admin panel
        if (userProfile?.isAdmin === true) {
            router.push('/admin');
            return;
        }
    }, [userProfile, router]);

    // Update profile form when userProfile loads
    useEffect(() => {
        if (userProfile) {
            setProfileForm({
                fullName: userProfile.fullName || user?.displayName || '',
                phone: userProfile.phone || ''
            });
        }
    }, [userProfile, user?.displayName]);

    const handleSaveProfile = useCallback(async () => {
        setSavingProfile(true);
        try {
            const token = await user?.getIdToken();
            const response = await fetch(`/api/users/${user?.uid}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName: profileForm.fullName,
                    phone: profileForm.phone
                })
            });
            if (response.ok) {
                const updated = await response.json();
                setUserProfile(updated);
                setEditingProfile(false);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setSavingProfile(false);
        }
    }, [profileForm, user?.uid]);

    const handleChangePassword = useCallback(async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            alert('Please fill in all password fields');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            alert('New password must be at least 6 characters');
            return;
        }

        setChangingPassword(true);
        try {
            const token = await user?.getIdToken();
            const response = await fetch(`/api/users/${user?.uid}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            });

            if (response.ok) {
                alert('Password changed successfully!');
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setShowPasswordChange(false);
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to change password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            alert('An error occurred while changing password');
        } finally {
            setChangingPassword(false);
        }
    }, [passwordForm, user?.uid]);

    // Memoized task calculations
    const todaysTasks = useMemo(() => tasks.filter(task => {
        const dueDate = new Date(task.finalTargetDate || task.dueDate);
        const isActive = !['completed', 'cancelled'].includes(task.status);
        return isActive && (isToday(dueDate) || isPast(dueDate));
    }), [tasks]);

    const currentWeekWindow = useMemo(() => ({
        start: startOfWeek(new Date(), { weekStartsOn: 1 }),
        end: endOfWeek(new Date(), { weekStartsOn: 1 })
    }), []);

    const weeklyTasks = useMemo(() => tasks.filter(task => {
        const dueDate = new Date(task.finalTargetDate || task.dueDate);
        const isActive = !['completed', 'cancelled'].includes(task.status);
        const inWeek = dueDate >= currentWeekWindow.start && dueDate <= currentWeekWindow.end;
        return isActive && inWeek && !isToday(dueDate);
    }), [tasks, currentWeekWindow]);

    const filteredAllTasks = useMemo(() => {
        let filtered = tasks;

        switch (taskFilter) {
            case 'active':
                filtered = tasks.filter(t => !['completed', 'cancelled'].includes(t.status));
                break;
            case 'completed':
                filtered = tasks.filter(t => t.status === 'completed');
                break;
            case 'overdue':
                filtered = tasks.filter(t => {
                    const dueDate = new Date(t.finalTargetDate || t.dueDate);
                    return !['completed', 'cancelled'].includes(t.status) && isPast(dueDate) && !isToday(dueDate);
                });
                break;
            default:
                filtered = tasks;
        }

        return filtered.sort((a, b) => {
            const dateA = new Date(a.finalTargetDate || a.dueDate);
            const dateB = new Date(b.finalTargetDate || b.dueDate);
            return dateB.getTime() - dateA.getTime();
        });
    }, [tasks, taskFilter]);

    const getDueDateLabel = useCallback((task: Task) => {
        const dueDate = new Date(task.finalTargetDate || task.dueDate);
        if (isToday(dueDate)) return 'Due Today';
        if (isPast(dueDate)) return `Overdue by ${differenceInDays(new Date(), dueDate)} days`;
        return `Due in ${differenceInDays(dueDate, new Date())} days`;
    }, []);

    const handleQuickStatusUpdate = useCallback(async (taskId: string, newStatus: TaskStatus) => {
        setCompletingTasks(prev => new Set(prev).add(taskId));
        try {
            const token = await user?.getIdToken();
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus, updatedAt: new Date() })
            });

            if (response.ok) {
                // Update local state instead of refetching
                const updatedTasks = tasks.map(t =>
                    t.id === taskId ? { ...t, status: newStatus } : t
                );
                setTasks(updatedTasks as any);
            }
        } catch (error) {
            console.error('Failed to update task status:', error);
        } finally {
            setCompletingTasks(prev => {
                const newSet = new Set(prev);
                newSet.delete(taskId);
                return newSet;
            });
        }
    }, [user?.uid]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Simple Clean Header */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                    <span className="font-bold text-slate-900">Dashboard</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-500">Welcome, {userProfile?.fullName || 'User'}</span>
                    <button onClick={() => signOut()} className="text-sm font-bold text-slate-400 hover:text-red-500">
                        Logout
                    </button>
                </div>
            </header>

            {/* Simple Tab Navigation */}
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex flex-wrap gap-2 mb-8 justify-center">
                    {[
                        { id: 'tasks', label: 'My Tasks', icon: ClipboardList },
                        { id: 'delegated', label: 'Delegate', icon: Plus },
                        { id: 'history', label: 'History', icon: History },
                        { id: 'performance', label: 'Score', icon: Trophy },
                        { id: 'okr', label: 'Goals', icon: Target },
                        { id: 'academy', label: 'Academy', icon: BookOpen },
                        { id: 'profile', label: 'Profile', icon: User },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all",
                                activeTab === tab.id
                                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                                    : "bg-white text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="space-y-6">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="glass-card p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Profile</p>
                                {!editingProfile ? (
                                    <button
                                        onClick={() => setEditingProfile(true)}
                                        className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg sm:rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95"
                                    >
                                        Edit Profile
                                    </button>
                                ) : (
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => {
                                                setEditingProfile(false);
                                                setProfileForm({
                                                    fullName: userProfile?.fullName || user?.displayName || '',
                                                    phone: userProfile?.phone || ''
                                                });
                                            }}
                                            className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-300 transition-all active:scale-95"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={savingProfile}
                                            className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 rounded-lg sm:rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-60"
                                        >
                                            {savingProfile ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-3 sm:gap-4 lg:gap-6 sm:grid-cols-2">
                                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 border border-white/70 backdrop-blur-xl">
                                    <p className="text-xs font-bold text-slate-500 mb-1.5 sm:mb-2">Name</p>
                                    {editingProfile ? (
                                        <input
                                            type="text"
                                            value={profileForm.fullName}
                                            onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                                            className="w-full px-3 py-2 text-base sm:text-lg font-bold text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Enter your name"
                                        />
                                    ) : (
                                        <p className="text-base sm:text-lg font-bold text-slate-900 truncate">{userProfile?.fullName || user?.displayName || 'N/A'}</p>
                                    )}
                                </div>
                                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 border border-white/70 backdrop-blur-xl">
                                    <p className="text-xs font-bold text-slate-500 mb-1.5 sm:mb-2">Phone</p>
                                    {editingProfile ? (
                                        <input
                                            type="tel"
                                            value={profileForm.phone}
                                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                            className="w-full px-3 py-2 text-base sm:text-lg font-bold text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Enter phone number"
                                        />
                                    ) : (
                                        <p className="text-base sm:text-lg font-bold text-slate-900">{userProfile?.phone || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 border border-white/70 backdrop-blur-xl">
                                    <p className="text-xs font-bold text-slate-500 mb-1.5 sm:mb-2">Email</p>
                                    <p className="text-base sm:text-lg font-bold text-slate-900 truncate">{user?.email || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Password Change Section */}
                            <div className="space-y-3">
                                {!showPasswordChange ? (
                                    <button
                                        onClick={() => setShowPasswordChange(true)}
                                        className="w-full px-4 py-3 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-all active:scale-95 shadow-md shadow-blue-500/20"
                                    >
                                        Change Password
                                    </button>
                                ) : (
                                    <div className="p-4 sm:p-6 rounded-xl bg-white/70 border border-white/70 backdrop-blur-xl space-y-3">
                                        <p className="text-sm font-bold text-slate-900">Change Password</p>

                                        <div>
                                            <input
                                                type="password"
                                                placeholder="Current Password"
                                                value={passwordForm.currentPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <input
                                                type="password"
                                                placeholder="New Password"
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <input
                                                type="password"
                                                placeholder="Confirm Password"
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setShowPasswordChange(false);
                                                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                                }}
                                                className="flex-1 px-3 py-2 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 transition-all active:scale-95"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleChangePassword}
                                                disabled={changingPassword}
                                                className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-60"
                                            >
                                                {changingPassword ? 'Changing...' : 'Change'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={() => signOut()}
                                className="w-full px-4 py-3 sm:py-3.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-red-500/20"
                            >
                                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}

                    {/* My Tasks Tab (Today + This Week) */}
                    {activeTab === 'performance' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <PerformanceScoreboard />
                        </div>
                    )}

                    {activeTab === 'okr' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <OKRList />
                        </div>
                    )}

                    {activeTab === 'academy' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <LearningHub />
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <>
                            <div className="glass-card p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                                    <div>
                                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                            <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
                                            My Tasks
                                        </p>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <button
                                            onClick={() => location.reload()}
                                            className="px-3 py-2 text-xs font-bold rounded-lg sm:rounded-xl border border-slate-200 text-slate-600 bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all"
                                        >
                                            Refresh
                                        </button>
                                    </div>
                                </div>

                                {todaysTasks.length === 0 ? (
                                    <div className="p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-white/60 border border-white/60 backdrop-blur-xl text-center">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-500">
                                            <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
                                        </div>
                                        <h3 className="text-base sm:text-lg font-bold text-slate-900">You're caught up</h3>
                                        <p className="text-xs sm:text-sm text-slate-500 mt-1">Nothing due right now. You can delegate below.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 sm:space-y-3">
                                        {todaysTasks.map(task => (
                                            <div
                                                key={task.id}
                                                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 border border-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                <button
                                                    onClick={() => handleQuickStatusUpdate(task.id, 'completed')}
                                                    disabled={completingTasks.has(task.id)}
                                                    className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-xl sm:rounded-2xl border-2 border-slate-200 bg-white text-slate-500 flex items-center justify-center hover:border-green-200 hover:text-green-600 transition-all disabled:opacity-60 self-start sm:self-center"
                                                    aria-label="Mark complete"
                                                >
                                                    {completingTasks.has(task.id) ? (
                                                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                                    ) : (
                                                        <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    )}
                                                </button>

                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[9px] sm:text-[11px] font-black uppercase tracking-wider">
                                                        {task.taskNumber && (
                                                            <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">{task.taskNumber}</span>
                                                        )}
                                                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-md border text-slate-800 ${priorityColors[task.priority as Priority]}`}>
                                                            {task.priority}
                                                        </span>
                                                        <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600">
                                                            {task.category || 'General'}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight line-clamp-2 sm:truncate">{task.title}</h3>
                                                    {task.description && (
                                                        <p className="text-xs sm:text-sm text-slate-500 line-clamp-2">{task.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-bold text-slate-500">
                                                        <span className="flex items-center gap-1 sm:gap-1.5 text-indigo-600">
                                                            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                            <span className="line-clamp-1">{getDueDateLabel(task)}</span>
                                                        </span>
                                                        {task.assignedByName && (
                                                            <span className="px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-slate-100 text-slate-600 text-[9px] sm:text-xs truncate max-w-[150px]">From {task.assignedByName}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleQuickStatusUpdate(task.id, 'completed')}
                                                    disabled={completingTasks.has(task.id)}
                                                    className="w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs sm:text-sm font-bold shadow-sm sm:shadow-md shadow-emerald-500/20 hover:shadow-lg active:scale-95 transition-all"
                                                >
                                                    {completingTasks.has(task.id) ? 'Finishing…' : 'Mark Complete'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="glass-card p-6 sm:p-8 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">This Week</p>
                                        <h3 className="text-xl font-black text-slate-900 mt-1">Tasks scheduled this week</h3>
                                        <p className="text-sm text-slate-500">See what is planned for the current week.</p>
                                    </div>
                                </div>

                                {weeklyTasks.length === 0 ? (
                                    <div className="p-6 rounded-2xl bg-white/60 border border-white/70 backdrop-blur-xl text-slate-600 text-sm">
                                        Nothing scheduled for this week yet.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {weeklyTasks.map(task => (
                                            <div
                                                key={task.id}
                                                className="flex items-start justify-between gap-3 p-4 rounded-2xl bg-white/70 border border-white/70 backdrop-blur-xl"
                                            >
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-sm font-bold text-slate-900 truncate">{task.title}</p>
                                                    <p className="text-xs text-slate-500 truncate">Assigned by {task.assignedByName || 'manager'}</p>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                        <span className="flex items-center gap-1.5 text-indigo-600">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {getDueDateLabel(task)}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${statusColors[task.status]}`}>
                                                            {statusLabels[task.status]}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleQuickStatusUpdate(task.id, 'completed')}
                                                    disabled={completingTasks.has(task.id)}
                                                    className="px-3 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold shadow-sm hover:shadow-md active:scale-95 transition-all disabled:opacity-60"
                                                >
                                                    {completingTasks.has(task.id) ? 'Finishing…' : 'Mark done'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Delegated Tasks Tab */}
                    {activeTab === 'delegated' && (
                        <div className="glass-card p-4 sm:p-6 lg:p-8 space-y-3 sm:space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Delegate Tasks</p>
                                <button
                                    onClick={() => setShowCreateTask(true)}
                                    className="w-full sm:w-auto px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold shadow-sm sm:shadow-md shadow-indigo-500/20 hover:shadow-lg active:scale-95 transition-all"
                                >
                                    <Plus className="w-4 h-4 mr-2 inline" />
                                    Delegate new task
                                </button>
                            </div>

                            {delegatedTasks.length === 0 ? (
                                <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/60 border border-white/70 backdrop-blur-xl text-slate-600 text-xs sm:text-sm text-center">
                                    No delegated tasks yet. Tap the button to assign one.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {delegatedTasks.map(task => (
                                        <div
                                            key={task.id}
                                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 border border-white/70 backdrop-blur-xl"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-900 line-clamp-1">{task.title}</p>
                                                <p className="text-[10px] sm:text-xs text-slate-500">Assigned to {task.assignedTo?.length || 0} teammate(s)</p>
                                            </div>
                                            <span className={`px-2 sm:px-2.5 py-1 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-bold ${statusColors[task.status]} self-start sm:self-center`}>
                                                {statusLabels[task.status]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* All Tasks History Tab */}
                    {activeTab === 'history' && (
                        <div className="glass-card p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Task History</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                                    <select
                                        value={taskFilter}
                                        onChange={(e) => setTaskFilter(e.target.value as any)}
                                        className="px-2.5 sm:px-3 py-2 text-xs font-bold rounded-lg sm:rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 sm:flex-initial min-w-0"
                                    >
                                        <option value="all">All Tasks</option>
                                        <option value="active">Active Only</option>
                                        <option value="completed">Completed</option>
                                        <option value="overdue">Overdue</option>
                                    </select>
                                    <button
                                        onClick={() => location.reload()}
                                        className="px-3 py-2 text-xs font-bold rounded-lg sm:rounded-xl border border-slate-200 text-slate-600 bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all"
                                    >
                                        Refresh
                                    </button>
                                </div>
                            </div>

                            {filteredAllTasks.length === 0 ? (
                                <div className="p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-white/60 border border-white/60 backdrop-blur-xl text-center">
                                    <p className="text-sm sm:text-base text-slate-600">No tasks found for this filter.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 sm:space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                    {filteredAllTasks.map(task => {
                                        const dueDate = new Date(task.finalTargetDate || task.dueDate);
                                        const isOverdue = isPast(dueDate) && !isToday(dueDate) && !['completed', 'cancelled'].includes(task.status);

                                        return (
                                            <div
                                                key={task.id}
                                                className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 border border-white/70 backdrop-blur-xl"
                                            >
                                                <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                                                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[9px] sm:text-[11px] font-black uppercase tracking-wider">
                                                        {task.taskNumber && (
                                                            <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">{task.taskNumber}</span>
                                                        )}
                                                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-md border ${priorityColors[task.priority as Priority]}`}>
                                                            {task.priority}
                                                        </span>
                                                        <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[11px] font-bold ${statusColors[task.status]}`}>
                                                            {statusLabels[task.status]}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight line-clamp-2">{task.title}</h3>
                                                    {task.description && (
                                                        <p className="text-xs sm:text-sm text-slate-500 line-clamp-2">{task.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-bold text-slate-500 flex-wrap">
                                                        <span className={`flex items-center gap-1 sm:gap-1.5 ${isOverdue ? 'text-red-600' : 'text-indigo-600'}`}>
                                                            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                            {getDueDateLabel(task)}
                                                        </span>
                                                        {task.assignedByName && (
                                                            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-slate-100 text-slate-600 text-[9px] sm:text-xs truncate max-w-[150px]">Assigned by {task.assignedByName}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {task.status !== 'completed' && (
                                                    <button
                                                        onClick={() => handleQuickStatusUpdate(task.id, 'completed')}
                                                        disabled={completingTasks.has(task.id)}
                                                        className="w-full sm:w-auto px-3 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold shadow-sm hover:shadow-md active:scale-95 transition-all disabled:opacity-60 whitespace-nowrap"
                                                    >
                                                        {completingTasks.has(task.id) ? 'Finishing…' : 'Mark Done'}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showCreateTask && (
                <TaskForm
                    onClose={() => setShowCreateTask(false)}
                    onSaved={() => {
                        setShowCreateTask(false);
                        location.reload();
                    }}
                />
            )}
        </div>
    )
}

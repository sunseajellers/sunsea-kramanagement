// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Task, TaskStatus } from '@/types';
import {
    Calendar,
    Loader2,
    LogOut,
    Plus,
    ClipboardList,
    User,
    History,
    Filter,
    Trophy,
    Target,
    BookOpen,
    Ticket,
    RotateCcw
} from 'lucide-react';
import { TicketDashboard } from '@/components/features/tickets/TicketDashboard';
import { isPast, isToday, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import TaskForm from '@/components/features/tasks/TaskForm';
import { useDashboardData } from '@/hooks/useDashboardData';
import PerformanceScoreboard from '@/components/features/performance/PerformanceScoreboard';
import OKRList from '@/components/features/okr/OKRList';
import LearningHub from '@/components/features/learning/LearningHub';
import PersonalTaskWorkboard from '@/components/features/tasks/PersonalTaskWorkboard';
import SmartInsights from '@/components/features/intelligence/SmartInsights';



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
    overdue: 'Overdue'
};

export default function EmployeeDashboard() {
    const { user, loading: authLoading, signOut } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'tasks' | 'delegated' | 'history' | 'profile' | 'performance' | 'okr' | 'academy' | 'helpdesk'>('tasks');
    const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({ fullName: '', phone: '' });
    const [savingProfile, setSavingProfile] = useState(false);
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [changingPassword, setChangingPassword] = useState(false);
    const [showCreateTask, setShowCreateTask] = useState(false);

    // Use optimized data hook
    const { tasks, delegatedTasks, okrs, userProfile, loading, setUserProfile, refetch } = useDashboardData(
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


    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20">
            {/* Desktop Header - Hidden on Mobile */}
            <header className="hidden sm:flex sticky top-4 z-50 mx-4 mb-8 rounded-2xl glass-panel px-4 sm:px-5 py-2.5 items-center justify-between gap-4 shadow-xl shadow-primary/5 border-white/40 bg-white/90 backdrop-blur-xl transition-all">
                <div className="flex items-center gap-3 shrink-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95">
                        <img src="/logo.png" alt="Logo" className="w-5 h-5 sm:w-6 sm:h-6 object-contain brightness-0 invert" />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="font-black text-lg text-primary tracking-tighter leading-none uppercase">Dashboard</h1>
                    </div>
                </div>

                <nav className="flex items-center gap-1">
                    {[
                        { id: 'tasks', label: 'Works', icon: ClipboardList, module: 'tasks', action: 'view' },
                        { id: 'delegated', label: 'Assign', icon: Plus, module: 'tasks', action: 'create' },
                        { id: 'history', label: 'History', icon: History, module: 'activity_log', action: 'view' },
                        { id: 'performance', label: 'Results', icon: Trophy, module: 'performance', action: 'view' },
                        { id: 'okr', label: 'Strategy', icon: Target, module: 'okrs', action: 'view' },
                        { id: 'helpdesk', label: 'Support', icon: Ticket, module: 'tickets', action: 'view' },
                        { id: 'academy', label: 'Hub', icon: BookOpen, module: 'academy', action: 'view' },
                        { id: 'profile', label: 'Me', icon: User, module: 'profile', action: 'view' },
                    ].map((tab) => {
                        const { hasPermission } = useAuth();
                        if (tab.id !== 'profile' && !hasPermission(tab.module, tab.action)) return null;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden group whitespace-nowrap shrink-0",
                                    activeTab === tab.id
                                        ? "bg-primary text-white shadow-md shadow-primary/30"
                                        : "text-primary/60 hover:text-primary hover:bg-primary/5"
                                )}
                            >
                                <tab.icon className={cn("w-3 h-3 transition-transform duration-500", activeTab === tab.id ? "scale-110" : "group-hover:scale-110 group-hover:rotate-12")} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden lg:flex flex-col items-end mr-1">
                        <p className="text-[10px] font-black text-primary leading-none mb-1">{userProfile?.fullName || 'User'}</p>
                        <p className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest leading-none">{userProfile?.department || 'Operations'}</p>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="group w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all flex items-center justify-center border border-rose-100/50 active:scale-95"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </header>

            {/* Mobile Bottom Navigation - Sticky & Compact */}
            <div className="fixed bottom-6 left-2 right-2 z-[100] sm:hidden">
                <div className="flex items-center justify-between p-1 rounded-full glass-panel bg-white/95 backdrop-blur-2xl border-white/40 shadow-2xl shadow-primary/20">
                    {[
                        { id: 'tasks', label: 'Works', icon: ClipboardList, module: 'tasks', action: 'view' },
                        { id: 'delegated', label: 'Assign', icon: Plus, module: 'tasks', action: 'create' },
                        { id: 'history', label: 'History', icon: History, module: 'activity_log', action: 'view' },
                        { id: 'performance', label: 'Results', icon: Trophy, module: 'performance', action: 'view' },
                        { id: 'okr', label: 'Strategy', icon: Target, module: 'okrs', action: 'view' },
                        { id: 'helpdesk', label: 'Support', icon: Ticket, module: 'tickets', action: 'view' },
                        { id: 'academy', label: 'Hub', icon: BookOpen, module: 'academy', action: 'view' },
                        { id: 'profile', label: 'Me', icon: User, module: 'profile', action: 'view' },
                    ].map((tab) => {
                        const { hasPermission } = useAuth();
                        if (tab.id !== 'profile' && !hasPermission(tab.module, tab.action)) return null;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center justify-center p-2 rounded-full transition-all duration-300 flex-1",
                                    activeTab === tab.id
                                        ? "bg-primary text-white shadow-lg shadow-primary/25 scale-110"
                                        : "text-primary/40 hover:text-primary"
                                )}
                                title={tab.label}
                            >
                                <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "scale-110" : "")} />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-12 sm:pt-6 pb-32">
                {/* Centered Tab Identity - Optimized for Mobile */}
                {(() => {
                    const activeTabData = [
                        { id: 'tasks', label: 'Works', subtitle: 'Priority tasks and daily execution', icon: ClipboardList },
                        { id: 'delegated', label: 'Assign', subtitle: 'Assign tasks to your team members', icon: Plus },
                        { id: 'history', label: 'History', subtitle: 'Archive of past completed works', icon: History },
                        { id: 'performance', label: 'Results', subtitle: 'KPI tracking and scoring metrics', icon: Trophy },
                        { id: 'okr', label: 'Strategy', subtitle: 'Objectives and strategic goals', icon: Target },
                        { id: 'helpdesk', label: 'Support', subtitle: 'Technical assistance and tickets', icon: Ticket },
                        { id: 'academy', label: 'Hub', subtitle: 'Learning resources and guides', icon: BookOpen },
                        { id: 'profile', label: 'Me', subtitle: 'Profile and security settings', icon: User },
                    ].find(t => t.id === activeTab);

                    if (!activeTabData) return null;

                    return (
                        <div className="px-1 md:px-6 mb-10 animate-in fade-in slide-in-from-top-4 duration-1000 flex flex-col items-center text-center">
                            <div className="p-4 md:p-5 rounded-[2.25rem] bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-sm border border-primary/10 mb-4 scale-90 md:scale-110">
                                <activeTabData.icon className="w-7 h-7 md:w-8 md:h-8" />
                            </div>
                            <div className="space-y-1.5 md:space-y-2 max-w-2xl px-4">
                                <h2 className="text-3xl md:text-5xl font-black text-primary tracking-tighter uppercase leading-none">{activeTabData.label}</h2>
                                <p className="text-[10px] md:text-xs font-black text-muted-foreground/30 uppercase tracking-[0.2em] md:tracking-[0.4em] line-clamp-1">{activeTabData.subtitle}</p>
                            </div>
                        </div>
                    );
                })()}

                <div className="space-y-6">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="dashboard-card animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div />
                                {!editingProfile ? (
                                    <button
                                        onClick={() => setEditingProfile(true)}
                                        className="btn-primary"
                                    >
                                        Edit Profile
                                    </button>
                                ) : (
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={() => {
                                                setEditingProfile(false);
                                                setProfileForm({
                                                    fullName: userProfile?.fullName || user?.displayName || '',
                                                    phone: userProfile?.phone || ''
                                                });
                                            }}
                                            className="btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={savingProfile}
                                            className="btn-primary bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/10"
                                        >
                                            {savingProfile ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="p-6 rounded-3xl bg-white/50 border border-white/60 shadow-sm">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Full Name</p>
                                    {editingProfile ? (
                                        <input
                                            type="text"
                                            value={profileForm.fullName}
                                            onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                                            className="form-input"
                                            placeholder="Enter your name"
                                        />
                                    ) : (
                                        <p className="text-xl font-bold text-primary truncate">{userProfile?.fullName || user?.displayName || 'N/A'}</p>
                                    )}
                                </div>
                                <div className="p-6 rounded-3xl bg-white/50 border border-white/60 shadow-sm">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Phone Number</p>
                                    {editingProfile ? (
                                        <input
                                            type="tel"
                                            value={profileForm.phone}
                                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                            className="form-input"
                                            placeholder="Enter phone number"
                                        />
                                    ) : (
                                        <p className="text-xl font-bold text-primary">{userProfile?.phone || 'Not provided'}</p>
                                    )}
                                </div>
                                <div className="p-6 rounded-3xl bg-white/50 border border-white/60 shadow-sm">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Email Address</p>
                                    <p className="text-xl font-bold text-primary truncate">{user?.email || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Password Change Section */}
                            <div className="pt-6 border-t border-primary/5">
                                {!showPasswordChange ? (
                                    <button
                                        onClick={() => setShowPasswordChange(true)}
                                        className="btn-secondary w-full sm:w-auto"
                                    >
                                        Change Password
                                    </button>
                                ) : (
                                    <div className="p-8 rounded-[2rem] bg-indigo-50/50 border border-indigo-100/50 space-y-6 animate-in fade-in zoom-in-95">
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-primary text-lg">Change Password</h3>
                                            <p className="text-sm text-muted-foreground">Ensure your account is secure</p>
                                        </div>

                                        <div className="space-y-4 max-w-md">
                                            <input
                                                type="password"
                                                placeholder="Current Password"
                                                value={passwordForm.currentPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                className="form-input bg-white"
                                            />
                                            <input
                                                type="password"
                                                placeholder="New Password"
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                className="form-input bg-white"
                                            />
                                            <input
                                                type="password"
                                                placeholder="Confirm Password"
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                className="form-input bg-white"
                                            />
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => {
                                                    setShowPasswordChange(false);
                                                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                                }}
                                                className="btn-secondary"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleChangePassword}
                                                disabled={changingPassword}
                                                className="btn-primary"
                                            >
                                                {changingPassword ? 'Updating...' : 'Update Password'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={() => signOut()}
                                className="w-full btn-primary bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-destructive/20 mt-8"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>Sign Out</span>
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
                            <OKRList okrs={okrs} />
                        </div>
                    )}

                    {activeTab === 'helpdesk' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <TicketDashboard />
                        </div>
                    )}

                    {activeTab === 'academy' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <LearningHub />
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                            {user && <SmartInsights userId={user.uid} />}
                            <PersonalTaskWorkboard
                                tasks={tasks}
                                loading={loading}
                                onRefresh={refetch}
                            />
                        </div>
                    )}

                    {/* Delegated Tasks Tab */}
                    {activeTab === 'delegated' && (
                        <div className="dashboard-card animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div />
                                <button
                                    onClick={() => setShowCreateTask(true)}
                                    className="btn-primary"
                                >
                                    <Plus className="w-5 h-5" />
                                    Assign Task
                                </button>
                            </div>

                            {delegatedTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 px-4 rounded-[2.5rem] bg-white/40 border border-white/60 border-dashed text-center">
                                    <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                                        <Plus className="w-10 h-10 text-primary/30" />
                                    </div>
                                    <h3 className="text-lg font-bold text-primary mb-2">No tasks given</h3>
                                    <p className="text-muted-foreground max-w-sm">
                                        You haven't given any tasks to others yet. Press the button above to start.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {delegatedTasks.map(task => (
                                        <div
                                            key={task.id}
                                            className="group flex flex-col bg-white border border-slate-100 rounded-[2.25rem] shadow-xl shadow-slate-200/30 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
                                        >
                                            <div className="p-7 space-y-5 flex-1 flex flex-col">
                                                <div className="flex justify-between items-center">
                                                    <span className={cn(
                                                        "status-badge",
                                                        task.status === 'completed' ? 'status-badge-success' :
                                                            task.status === 'in_progress' ? 'status-badge-info' : 'status-badge-neutral'
                                                    )}>
                                                        {statusLabels[task.status]}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border",
                                                        task.priority === 'critical' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                                    )}>
                                                        {task.priority}
                                                    </span>
                                                </div>

                                                <h3 className="text-lg font-black text-primary leading-tight uppercase tracking-tight line-clamp-2">{task.title}</h3>

                                                <div className="mt-auto pt-5 border-t border-slate-50 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex -space-x-2">
                                                            {task.assignedTo?.slice(0, 3).map((assigneeId, i) => (
                                                                <div key={i} className="w-8 h-8 rounded-xl bg-primary text-white border-2 border-white flex items-center justify-center text-[10px] font-black shadow-sm">
                                                                    {assigneeId.substring(0, 1).toUpperCase()}
                                                                </div>
                                                            ))}
                                                            {(task.assignedTo?.length || 0) > 3 && (
                                                                <div className="w-8 h-8 rounded-xl bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-black text-slate-400">
                                                                    +{(task.assignedTo?.length || 0) - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                            {task.assignedTo?.length || 0} People
                                                        </span>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/5">
                                                        <Plus className="w-3.5 h-3.5 text-primary opacity-40" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* All Tasks History Tab */}
                    {activeTab === 'history' && (
                        <div className="dashboard-card animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div />
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="relative">
                                        <Filter className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                        <select
                                            value={taskFilter}
                                            onChange={(e) => setTaskFilter(e.target.value as any)}
                                            className="form-input pl-10 py-2.5 h-auto text-sm w-40 rounded-xl"
                                        >
                                            <option value="all">All Tasks</option>
                                            <option value="active">Active Only</option>
                                            <option value="completed">Completed</option>
                                            <option value="overdue">Overdue</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => location.reload()}
                                        className="btn-secondary py-2.5 h-auto rounded-xl"
                                    >
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Refresh
                                    </button>
                                </div>
                            </div>

                            {filteredAllTasks.length === 0 ? (
                                <div className="p-8 rounded-[2rem] bg-white/40 border border-white/60 border-dashed text-center">
                                    <p className="text-muted-foreground font-medium">No tasks found matching your filters.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 max-h-[700px] overflow-y-auto pr-2 scrollbar-none">
                                    {filteredAllTasks.map(task => {
                                        const dueDate = new Date(task.finalTargetDate || task.dueDate);
                                        const isOverdue = isPast(dueDate) && !isToday(dueDate) && !['completed', 'cancelled'].includes(task.status);

                                        return (
                                            <div
                                                key={task.id}
                                                className="group relative bg-white border border-slate-100 p-6 rounded-3xl shadow-lg shadow-slate-200/20 transition-all hover:shadow-xl hover:-translate-y-0.5"
                                            >
                                                <div className="flex flex-col gap-4">
                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <div className="flex items-center gap-2">
                                                            {task.taskNumber && (
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">#{task.taskNumber}</span>
                                                            )}
                                                            <span className={cn(
                                                                "status-badge scale-90 origin-left !px-3 !py-1",
                                                                task.status === 'completed' ? 'status-badge-success' :
                                                                    isOverdue ? 'status-badge-danger' : 'status-badge-info'
                                                            )}>
                                                                {statusLabels[task.status]}
                                                            </span>
                                                        </div>
                                                        <span className={cn(
                                                            "text-[9px] font-black uppercase tracking-widest",
                                                            task.priority === 'critical' ? 'text-rose-500' : 'text-slate-400'
                                                        )}>
                                                            {task.priority} Prio
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <h3 className="text-md font-black text-primary leading-tight uppercase tracking-tight line-clamp-1">{task.title}</h3>
                                                        {task.description && (
                                                            <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-1 italic">{task.description}</p>
                                                        )}
                                                    </div>

                                                    <div className="flex pt-4 border-t border-slate-50 items-center justify-between">
                                                        <div className={cn(
                                                            "flex items-center gap-2 text-[10px] font-black uppercase tracking-tight",
                                                            isOverdue ? 'text-rose-500' : 'text-primary/60'
                                                        )}>
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {getDueDateLabel(task)}
                                                        </div>
                                                        {task.assignedByName && (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                                                    <User className="w-3 h-3 text-slate-400" />
                                                                </div>
                                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{task.assignedByName}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
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

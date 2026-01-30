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
            {/* Premium Header */}
            <header className="sticky top-6 z-40 mx-6 mb-8 rounded-[2rem] glass-panel px-8 py-5 flex items-center justify-between shadow-xl shadow-primary/5 border-white/40">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
                        <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain brightness-0 invert" />
                    </div>
                    <div>
                        <h1 className="font-extrabold text-2xl text-primary tracking-tight">Dashboard</h1>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Employee Portal</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-bold text-primary">{userProfile?.fullName || 'User'}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{userProfile?.department || 'Team Member'}</p>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="w-10 h-10 rounded-xl bg-destructive/5 text-destructive hover:bg-destructive/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Premium Tab Navigation */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
                <div className="flex overflow-x-auto pb-2 sm:pb-0 gap-2 mb-10 sm:justify-center p-2 rounded-[2rem] glass-panel w-full sm:w-fit mx-auto shadow-2xl shadow-primary/5 border-white/40 bg-white/50 backdrop-blur-2xl sticky top-28 z-30 scrollbar-hide">
                    {[
                        { id: 'tasks', label: 'Workboard', icon: ClipboardList },
                        { id: 'delegated', label: 'Delegated', icon: Plus },
                        { id: 'history', label: 'History', icon: History },
                        { id: 'performance', label: 'Performance', icon: Trophy },
                        { id: 'okr', label: 'OKRs', icon: Target },
                        { id: 'helpdesk', label: 'Helpdesk', icon: Ticket },
                        { id: 'academy', label: 'Academy', icon: BookOpen },
                        { id: 'profile', label: 'Profile', icon: User },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2.5 px-6 py-3 rounded-[1.5rem] text-sm font-bold transition-all duration-300 relative overflow-hidden group whitespace-nowrap flex-shrink-0",
                                activeTab === tab.id
                                    ? "bg-primary text-white shadow-lg shadow-primary/25 scale-105"
                                    : "text-muted-foreground hover:text-primary hover:bg-white/60"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4 transition-transform duration-300", activeTab === tab.id ? "scale-110" : "group-hover:scale-110")} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="space-y-6">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="dashboard-card animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-primary">My Profile</h2>
                                    <p className="text-sm text-muted-foreground">Manage your personal information and security</p>
                                </div>
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
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                <div>
                                    <h2 className="text-2xl font-bold text-primary">Delegations</h2>
                                    <p className="text-sm text-muted-foreground">Tasks you've assigned to others</p>
                                </div>
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
                                    <h3 className="text-lg font-bold text-primary mb-2">No delegated tasks</h3>
                                    <p className="text-muted-foreground max-w-sm">
                                        You haven't assigned any roles or tasks to teammates yet. Tap the button above to get started.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {delegatedTasks.map(task => (
                                        <div
                                            key={task.id}
                                            className="group p-6 rounded-[2rem] bg-white border border-white/60 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-default"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <span className={`status-badge ${task.status === 'completed' ? 'status-badge-success' :
                                                    task.status === 'in_progress' ? 'status-badge-info' :
                                                        'status-badge-neutral'
                                                    }`}>
                                                    {statusLabels[task.status]}
                                                </span>
                                                <span className="text-xs font-bold text-muted-foreground/50">
                                                    {task.priority.toUpperCase()}
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-primary text-lg mb-2 line-clamp-2">{task.title}</h3>

                                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dashed border-primary/5">
                                                <div className="flex -space-x-2">
                                                    {task.assignedTo?.slice(0, 3).map((assigneeId, i) => (
                                                        <div key={i} className="w-8 h-8 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-[10px] font-bold text-primary">
                                                            {assigneeId.substring(0, 1)}
                                                        </div>
                                                    ))}
                                                </div>
                                                <span className="text-xs font-bold text-muted-foreground">
                                                    {task.assignedTo?.length || 0} assignee(s)
                                                </span>
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
                                <div>
                                    <h2 className="text-2xl font-bold text-primary">Task History</h2>
                                    <p className="text-sm text-muted-foreground mr-2">Track all your task activities</p>
                                </div>
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
                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scroll-panel">
                                    {filteredAllTasks.map(task => {
                                        const dueDate = new Date(task.finalTargetDate || task.dueDate);
                                        const isOverdue = isPast(dueDate) && !isToday(dueDate) && !['completed', 'cancelled'].includes(task.status);

                                        return (
                                            <div
                                                key={task.id}
                                                className="group p-5 rounded-[2rem] bg-white border border-white/60 shadow-sm hover:shadow-md transition-all"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                                    <div className="flex-1 min-w-0 space-y-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {task.taskNumber && (
                                                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">#{task.taskNumber}</span>
                                                            )}
                                                            <span className={`status-badge ${task.status === 'completed' ? 'status-badge-success' :
                                                                task.status === 'overdue' || isOverdue ? 'status-badge-danger' :
                                                                    'status-badge-info'
                                                                }`}>
                                                                {statusLabels[task.status]}
                                                            </span>
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${task.priority === 'critical' ? 'text-destructive' : 'text-muted-foreground'
                                                                }`}>
                                                                {task.priority} Priority
                                                            </span>
                                                        </div>

                                                        <h3 className="text-lg font-bold text-primary leading-tight hover:text-blue-600 transition-colors cursor-pointer">{task.title}</h3>

                                                        {task.description && (
                                                            <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                                                        )}

                                                        <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground pt-2">
                                                            <span className={`flex items-center gap-1.5 ${isOverdue ? 'text-destructive' : 'text-primary'}`}>
                                                                <Calendar className="w-4 h-4" />
                                                                {getDueDateLabel(task)}
                                                            </span>
                                                            {task.assignedByName && (
                                                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/50 border border-slate-200/50">
                                                                    <User className="w-3 h-3" />
                                                                    By {task.assignedByName}
                                                                </span>
                                                            )}
                                                        </div>
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

'use client'

import { useState, useEffect } from 'react';
import StaffDirectory from './StaffDirectory';
import LeaveCalendar from '../hr/LeaveCalendar';
import LeaveRequestModal from '../hr/LeaveRequestModal';
import { getStaffStats, getRecentAttendance, StaffStats, AttendanceRecord } from '@/lib/staffService';
import { getLeaveRequests } from '@/lib/hrService'; // Import HR service
import { Users, UserCheck, Calendar, UserMinus, Building2, Clock, MapPin, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LeaveRequest } from '@/types';

export default function StaffDashboard() {
    const [stats, setStats] = useState<StaffStats | null>(null)
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'overview' | 'leaves'>('overview')
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)

    // Mock user for now - in real app would come from auth context
    const currentUser = { id: 'u1', name: 'Alex Johnson' };

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [s, a, l] = await Promise.all([
                getStaffStats(),
                getRecentAttendance(),
                getLeaveRequests()
            ])
            setStats(s)
            setAttendance(a)
            setLeaveRequests(l)
        } catch (error) {
            console.error('Failed to load staff data')
        } finally {
            setLoading(false)
        }
    }

    if (loading || !stats) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Clock className="w-8 h-8 animate-spin text-primary/40" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Loading Workplace...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff & Workplace</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage employee profiles, track attendance, and monitor department headcount.</p>
                </div>

                {/* Navigation Tabs */}
                <div className="flex bg-slate-100/50 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={cn(
                            "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2",
                            activeTab === 'overview' ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Users className="w-3 h-3" />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('leaves')}
                        className={cn(
                            "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2",
                            activeTab === 'leaves' ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Briefcase className="w-3 h-3" />
                        Leave & Attendance
                    </button>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={() => setIsLeaveModalOpen(true)}
                        variant="outline"
                        className="h-11 px-6 border-slate-200"
                    >
                        Request Leave
                    </Button>
                    <Button className="btn-primary h-11 px-6 shadow-lg shadow-primary/20">
                        <Users className="w-4 h-4 mr-2" />
                        Staff Directory
                    </Button>
                </div>
            </div>

            <LeaveRequestModal
                isOpen={isLeaveModalOpen}
                onClose={() => setIsLeaveModalOpen(false)}
                onSuccess={loadData}
                userId={currentUser.id}
                userName={currentUser.name}
            />

            {activeTab === 'overview' ? (
                <>
                    {/* Workplace Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Staff', value: stats.totalEmployees, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { label: 'Active Now', value: stats.activeNow, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'On Leave', value: stats.onLeave, icon: UserMinus, color: 'text-rose-600', bg: 'bg-rose-50' },
                            { label: 'Late Arrival', value: stats.lateArrivals, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                        ].map((stat) => (
                            <div key={stat.label} className="glass-panel p-6">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                                        <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Department Distribution */}
                        <div className="lg:col-span-2 glass-panel p-6">
                            <div className="flex items-center gap-3 mb-8">
                                <Building2 className="w-5 h-5 text-primary" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Department Headcount</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                {Object.entries(stats.headcountByDepartment).map(([dept, count]) => (
                                    <div key={dept} className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50 flex flex-col items-center text-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{dept}</p>
                                        <p className="text-xl font-black text-slate-900">{count}</p>
                                        <div className="w-full h-1 bg-slate-200 rounded-full mt-3 overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: `${(count / stats.totalEmployees) * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity / Attendance Log placeholder */}
                        <div className="glass-panel p-6 flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Today's Log</h3>
                                </div>
                                <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase tracking-widest text-primary">View All</Button>
                            </div>
                            <div className="space-y-6 flex-1">
                                {attendance.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                                                {log.userName.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{log.userName}</p>
                                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                    <MapPin className="w-2.5 h-2.5" />
                                                    Central Office
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-slate-900">{log.checkIn}</p>
                                            <span className={cn(
                                                "text-[8px] font-black uppercase tracking-widest",
                                                log.status === 'present' ? "text-emerald-500" : "text-amber-500"
                                            )}>{log.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Directory Section */}
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-1 bg-primary rounded-full" />
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Employee Directory</h2>
                        </div>
                        <StaffDirectory />
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 glass-panel p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-slate-900">Team Leave Calendar</h3>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-200"></div> Approved
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-200"></div> Pending
                                </div>
                            </div>
                        </div>
                        <LeaveCalendar requests={leaveRequests} />
                    </div>

                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-black text-slate-900 mb-4">My Leave Balance</h3>
                        <div className="space-y-4">
                            {[
                                { type: 'Casual Leave', total: 12, used: 4 },
                                { type: 'Sick Leave', total: 10, used: 1 },
                                { type: 'Earned Leave', total: 15, used: 0 },
                            ].map(leave => (
                                <div key={leave.type} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs font-bold text-slate-500 uppercase">{leave.type}</span>
                                        <span className="text-xs font-black text-slate-900">{leave.total - leave.used} Remaining</span>
                                    </div>
                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${(leave.used / leave.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

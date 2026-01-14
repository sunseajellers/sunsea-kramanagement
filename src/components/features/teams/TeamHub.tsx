'use client'

import { useState, useEffect, useMemo } from 'react'
import { getAllUsers } from '@/lib/userService'
import { getAllTeams } from '@/lib/teamService'
import { User, Team } from '@/types'
import { Users, UserCheck, AlertCircle, Plus, Eye, BarChart3, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

interface EmployeeStats {
    userId: string
    userName: string
    email: string
    teamId?: string
    teamName?: string
    openTasks: number
    overdueTasks: number
    completedTasks: number
    isAdmin: boolean
}

const ITEMS_PER_PAGE = 8;

export default function TeamHub() {
    const [employees, setEmployees] = useState<EmployeeStats[]>([])
    const [teams, setTeams] = useState<Team[]>([])
    const [loading, setLoading] = useState(true)
    const [filterTeam, setFilterTeam] = useState<string>('')
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [usersData, teamsData] = await Promise.all([
                getAllUsers(),
                getAllTeams()
            ])

            // Build a team lookup map
            const teamMap = new Map<string, string>()
            teamsData.forEach(t => teamMap.set(t.id, t.name))

            // Fetch task counts for each user
            const employeeStats: EmployeeStats[] = await Promise.all(
                usersData.map(async (user: User) => {
                    // Query tasks assigned to this user
                    const tasksQuery = query(
                        collection(db, 'tasks'),
                        where('assignedTo', 'array-contains', user.id)
                    )
                    const tasksSnapshot = await getDocs(tasksQuery)

                    let openTasks = 0
                    let overdueTasks = 0
                    let completedTasks = 0
                    const now = new Date()

                    tasksSnapshot.docs.forEach(doc => {
                        const task = doc.data()
                        if (task.status === 'completed') {
                            completedTasks++
                        } else {
                            openTasks++
                            const dueDate = task.dueDate?.toDate?.() || new Date(task.dueDate)
                            if (dueDate < now) {
                                overdueTasks++
                            }
                        }
                    })

                    return {
                        userId: user.id,
                        userName: user.fullName || user.email,
                        email: user.email,
                        teamId: user.teamId,
                        teamName: user.teamId ? teamMap.get(user.teamId) : undefined,
                        openTasks,
                        overdueTasks,
                        completedTasks,
                        isAdmin: (user as any).isAdmin || false,
                    }
                })
            )

            setEmployees(employeeStats)
            setTeams(teamsData)
        } catch (error) {
            console.error('Failed to load team hub data:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredEmployees = useMemo(() => {
        return filterTeam
            ? employees.filter(e => e.teamId === filterTeam)
            : employees
    }, [employees, filterTeam])

    // Pagination
    const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE)
    const paginatedEmployees = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredEmployees.slice(start, start + ITEMS_PER_PAGE)
    }, [filteredEmployees, currentPage])

    // Stats calculations
    const totalOpenTasks = employees.reduce((sum, e) => sum + e.openTasks, 0)
    const totalOverdueTasks = employees.reduce((sum, e) => sum + e.overdueTasks, 0)
    const totalCompletedTasks = employees.reduce((sum, e) => sum + e.completedTasks, 0)

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center animate-pulse">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Loading monitoring data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Performance Monitoring</h2>
                    <p className="text-gray-400 text-xs font-medium">Real-time oversight of employee workloads</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={filterTeam}
                        onChange={(e) => { setFilterTeam(e.target.value); setCurrentPage(1); }}
                        className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                    >
                        <option value="">All Teams</option>
                        {teams.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                    <Button onClick={loadData} variant="outline" className="h-9 px-3 rounded-xl text-xs font-medium border-gray-200">
                        <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="stat-card">
                    <div className="flex flex-col gap-0.5">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Total Employees</p>
                        <h3 className="text-2xl font-bold text-gray-900">{employees.length}</h3>
                    </div>
                    <div className="icon-box icon-box-md bg-blue-50 text-blue-600">
                        <Users className="h-5 w-5" />
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex flex-col gap-0.5">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Active Tasks</p>
                        <h3 className="text-2xl font-bold text-gray-900">{totalOpenTasks}</h3>
                    </div>
                    <div className="icon-box icon-box-md bg-amber-50 text-amber-600">
                        <UserCheck className="h-5 w-5" />
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex flex-col gap-0.5">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Overdue</p>
                        <h3 className="text-2xl font-bold text-red-600">{totalOverdueTasks}</h3>
                    </div>
                    <div className="icon-box icon-box-md bg-red-50 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex flex-col gap-0.5">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Completed</p>
                        <h3 className="text-2xl font-bold text-green-600">{totalCompletedTasks}</h3>
                    </div>
                    <div className="icon-box icon-box-md bg-green-50 text-green-600">
                        <UserCheck className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* Employee Table */}
            <div className="glass-card flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-400">{filteredEmployees.length} employees</span>
                </div>

                <div className="flex-1 overflow-hidden">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th className="text-center">Team</th>
                                <th className="text-center">Open Tasks</th>
                                <th className="text-center">Overdue</th>
                                <th className="text-center">Completed</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                    </table>
                    <div className="scroll-panel flex-1">
                        <table className="data-table">
                            <tbody>
                                {paginatedEmployees.length > 0 ? (
                                    paginatedEmployees.map((employee) => (
                                        <tr key={employee.userId} className="group">
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                                                        {employee.userName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold text-gray-900">{employee.userName}</p>
                                                            {employee.isAdmin && (
                                                                <span className="badge badge-info text-[8px] py-0">Admin</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-gray-400">{employee.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className="text-xs font-medium text-gray-500">
                                                    {employee.teamName || '—'}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge badge-warning">{employee.openTasks}</span>
                                            </td>
                                            <td className="text-center">
                                                <span className={`badge ${employee.overdueTasks > 0 ? 'badge-danger' : 'badge-neutral'}`}>
                                                    {employee.overdueTasks}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge badge-success">{employee.completedTasks}</span>
                                            </td>
                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Link href={`/admin/employee-updates/${employee.userId}`}>
                                                        <Button variant="ghost" size="sm" className="h-7 px-2 rounded-lg text-[10px] font-semibold text-violet-600 hover:text-violet-700 hover:bg-violet-50">
                                                            <MessageSquare className="w-3 h-3 mr-1" />
                                                            Updates
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/admin/tasks?userId=${employee.userId}`}>
                                                        <Button variant="ghost" size="sm" className="h-7 px-2 rounded-lg text-[10px] font-semibold">
                                                            <Eye className="w-3 h-3 mr-1" />
                                                            Tasks
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/admin/tasks?assignTo=${employee.userId}`}>
                                                        <Button size="sm" className="h-7 px-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-[10px] font-semibold">
                                                            <Plus className="w-3 h-3 mr-1" />
                                                            Assign
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="empty-state my-8">
                                                <div className="empty-state-icon">
                                                    <Users className="w-6 h-6" />
                                                </div>
                                                <p className="empty-state-title">No employees found</p>
                                                <p className="empty-state-description">
                                                    {filterTeam ? 'Try selecting a different team' : 'Add employees to get started'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
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
                                const page = i + 1
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
                                )
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
        </div>
    )
}

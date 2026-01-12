'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAllUsers } from '@/lib/userService'
import { getAllTeams } from '@/lib/teamService'
import { User, Team } from '@/types'
import { Users, UserCheck, AlertCircle, Plus, Eye, BarChart3, Loader2, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export default function TeamHubPage() {
    useAuth()
    const [employees, setEmployees] = useState<EmployeeStats[]>([])
    const [teams, setTeams] = useState<Team[]>([])
    const [loading, setLoading] = useState(true)
    const [filterTeam, setFilterTeam] = useState<string>('')

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

    const filteredEmployees = filterTeam
        ? employees.filter(e => e.teamId === filterTeam)
        : employees

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Team Data...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <Users className="w-7 h-7 text-blue-600" />
                        Team Hub
                    </h1>
                    <p className="text-sm text-gray-400 font-medium mt-1">
                        View employee task status and assign new tasks
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filterTeam}
                        onChange={(e) => setFilterTeam(e.target.value)}
                        className="h-10 px-4 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    >
                        <option value="">All Teams</option>
                        {teams.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                    <Button
                        onClick={loadData}
                        variant="outline"
                        className="h-10 border-gray-100 text-[10px] font-black uppercase tracking-widest"
                    >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Employees</p>
                            <p className="text-2xl font-black text-gray-900 mt-1">{employees.length}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Users className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Tasks</p>
                            <p className="text-2xl font-black text-gray-900 mt-1">
                                {employees.reduce((sum, e) => sum + e.openTasks, 0)}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <UserCheck className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overdue Tasks</p>
                            <p className="text-2xl font-black text-red-600 mt-1">
                                {employees.reduce((sum, e) => sum + e.overdueTasks, 0)}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Completed</p>
                            <p className="text-2xl font-black text-green-600 mt-1">
                                {employees.reduce((sum, e) => sum + e.completedTasks, 0)}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                            <UserCheck className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Employee Table */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b bg-gray-50/30 px-6 py-4">
                    <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Employee Overview
                    </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-gray-50/30">
                                <th className="text-left py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                                <th className="text-center py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Team</th>
                                <th className="text-center py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Open Tasks</th>
                                <th className="text-center py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Overdue</th>
                                <th className="text-center py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Completed</th>
                                <th className="text-center py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredEmployees.map((employee) => (
                                <tr key={employee.userId} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                {employee.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{employee.userName}</p>
                                                <p className="text-[10px] text-gray-400">{employee.email}</p>
                                            </div>
                                            {employee.isAdmin && (
                                                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-purple-50 text-purple-600 border border-purple-100">
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <span className="text-xs font-bold text-gray-500">
                                            {employee.teamName || '—'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100">
                                            {employee.openTasks}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${employee.overdueTasks > 0
                                            ? 'bg-red-50 text-red-600 border border-red-100'
                                            : 'bg-gray-50 text-gray-400 border border-gray-100'
                                            }`}>
                                            {employee.overdueTasks}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-600 border border-green-100">
                                            {employee.completedTasks}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link href={`/admin/employee-updates/${employee.userId}`}>
                                                <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase tracking-widest text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                                                    <MessageSquare className="w-3.5 h-3.5 mr-1" />
                                                    Updates
                                                </Button>
                                            </Link>
                                            <Link href={`/admin`}>
                                                <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase tracking-widest">
                                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                                    Tasks
                                                </Button>
                                            </Link>
                                            <Link href={`/admin`}>
                                                <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-[9px] font-black uppercase tracking-widest">
                                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                                    Assign
                                                </Button>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}

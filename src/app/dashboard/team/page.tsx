'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAllUsers, updateUser } from '@/lib/userService'
import { getAllTeams, updateTeam } from '@/lib/teamService'
import { User, Team } from '@/types'
import { Loader2, Users, Plus, UserMinus, UserPlus, Crown, Award } from 'lucide-react'
import { getInitials, getAvatarColor } from '@/lib/utils'
import Modal from '@/components/Modal'

export default function TeamPage() {
    const { userData } = useAuth()
    const [users, setUsers] = useState<User[]>([])
    const [teams, setTeams] = useState<Team[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
    const [showAddMember, setShowAddMember] = useState(false)
    const [availableUsers, setAvailableUsers] = useState<User[]>([])

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [usersData, teamsData] = await Promise.all([
                getAllUsers(),
                getAllTeams()
            ])
            setUsers(usersData)
            setTeams(teamsData)
        } catch (error) {
            console.error('Failed to load team data', error)
        } finally {
            setLoading(false)
        }
    }

    const getTeamMembers = (teamId: string) => {
        return users.filter(user => user.teamId === teamId)
    }

    const getUserTeam = (userId: string) => {
        return teams.find(team => team.id === users.find(u => u.id === userId)?.teamId)
    }

    const handleAddToTeam = async (userId: string, teamId: string) => {
        try {
            await updateUser(userId, { teamId })
            await loadData()
        } catch (error) {
            console.error('Failed to add user to team', error)
        }
    }

    const handleRemoveFromTeam = async (userId: string) => {
        try {
            await updateUser(userId, { teamId: undefined })
            await loadData()
        } catch (error) {
            console.error('Failed to remove user from team', error)
        }
    }

    const getTeamStats = (teamId: string) => {
        const members = getTeamMembers(teamId)
        const admins = members.filter(m => m.role === 'admin').length
        const managers = members.filter(m => m.role === 'manager').length
        const employees = members.filter(m => m.role === 'employee').length

        return { total: members.length, admins, managers, employees }
    }

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                    <p className="text-gray-600">Manage your teams and team members</p>
                </div>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => {
                    const members = getTeamMembers(team.id)
                    const stats = getTeamStats(team.id)

                    return (
                        <div key={team.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                        <Users className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{team.name}</h3>
                                        <p className="text-sm text-gray-500">{stats.total} members</p>
                                    </div>
                                </div>
                                {(userData?.role === 'admin' || userData?.role === 'manager') && (
                                    <button
                                        onClick={() => {
                                            setSelectedTeam(team)
                                            setAvailableUsers(users.filter(u => !u.teamId || u.teamId !== team.id))
                                            setShowAddMember(true)
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Plus className="w-5 h-5 text-gray-600" />
                                    </button>
                                )}
                            </div>

                            {/* Team Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-blue-600">{stats.admins}</div>
                                    <div className="text-xs text-gray-500">Admins</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-green-600">{stats.managers}</div>
                                    <div className="text-xs text-gray-500">Managers</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-purple-600">{stats.employees}</div>
                                    <div className="text-xs text-gray-500">Employees</div>
                                </div>
                            </div>

                            {/* Team Members */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700">Members</h4>
                                {members.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {members.slice(0, 6).map((member) => (
                                            <div key={member.id} className="relative group">
                                                <div className={`w-8 h-8 bg-gradient-to-br ${getAvatarColor(member.fullName)} rounded-full flex items-center justify-center text-white text-xs font-semibold`}>
                                                    {getInitials(member.fullName)}
                                                </div>
                                                {(userData?.role === 'admin' || userData?.role === 'manager') && (
                                                    <button
                                                        onClick={() => handleRemoveFromTeam(member.id)}
                                                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                    >
                                                        <UserMinus className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {members.length > 6 && (
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600">
                                                +{members.length - 6}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No members yet</p>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Unassigned Users */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Unassigned Users</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.filter(user => !user.teamId).map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarColor(user.fullName)} rounded-full flex items-center justify-center text-white font-semibold`}>
                                    {getInitials(user.fullName)}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{user.fullName}</p>
                                    <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                                </div>
                            </div>
                            {(userData?.role === 'admin' || userData?.role === 'manager') && (
                                <div className="flex space-x-2">
                                    {teams.map((team) => (
                                        <button
                                            key={team.id}
                                            onClick={() => handleAddToTeam(user.id, team.id)}
                                            className="px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 transition-colors"
                                        >
                                            Add to {team.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {users.filter(user => !user.teamId).length === 0 && (
                        <p className="text-gray-500 col-span-full text-center py-8">All users are assigned to teams</p>
                    )}
                </div>
            </div>

            {/* Add Member Modal */}
            {showAddMember && selectedTeam && (
                <Modal
                    isOpen={showAddMember}
                    onClose={() => setShowAddMember(false)}
                    title={`Add Member to ${selectedTeam.name}`}
                >
                    <div className="space-y-4">
                        {availableUsers.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarColor(user.fullName)} rounded-full flex items-center justify-center text-white font-semibold`}>
                                        {getInitials(user.fullName)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{user.fullName}</p>
                                        <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        handleAddToTeam(user.id, selectedTeam.id)
                                        setShowAddMember(false)
                                    }}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        ))}
                        {availableUsers.length === 0 && (
                            <p className="text-gray-500 text-center py-8">No available users to add</p>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    )
}
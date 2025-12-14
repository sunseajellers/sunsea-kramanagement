'use client'

import { useState, useEffect } from 'react'
import { createKRA, updateKRA } from '@/lib/kraService'
import { KRA, KRAType, Priority, KRAStatus } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, X, Calendar, Target, FileText, Type } from 'lucide-react'
import { getAllUsers } from '@/lib/userService'
import { getAllTeams } from '@/lib/teamService'
import { userHasPermission } from '@/lib/rbacService'

interface Props {
    initialData?: KRA | null
    onClose: () => void
    onSaved: () => void
}

export default function KRAForm({ initialData, onClose, onSaved }: Props) {
    const { user, userData } = useAuth()
    const isEdit = !!initialData
    const [loading, setLoading] = useState(false)
    const [users, setUsers] = useState<any[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [hasAssignmentPermission, setHasAssignmentPermission] = useState(false)
    const [form, setForm] = useState({
        title: '',
        description: '',
        target: '',
        type: 'monthly' as KRAType,
        priority: 'medium' as Priority,
        status: 'not_started' as KRAStatus,
        assignedTo: [] as string[],
        teamIds: [] as string[],
        startDate: '',
        endDate: '',
    })

    useEffect(() => {
        // Load users and teams for assignment (admin/manager only)
        const checkPermission = async () => {
            if (userData?.uid) {
                const hasAdminAccess = await userHasPermission(userData.uid, 'admin', 'access');
                const hasManagerAccess = await userHasPermission(userData.uid, 'kra', 'manage');
                const hasPermission = hasAdminAccess || hasManagerAccess;
                setHasAssignmentPermission(hasPermission);
                if (hasPermission) {
                    Promise.all([
                        getAllUsers().then(setUsers).catch(console.error),
                        getAllTeams().then(setTeams).catch(console.error)
                    ])
                }
            }
        }
        checkPermission()
    }, [userData])

    useEffect(() => {
        if (initialData) {
            // Format dates for input type="date" (YYYY-MM-DD)
            const formatDate = (dateString: string) => {
                try {
                    return new Date(dateString).toISOString().split('T')[0]
                } catch (e) {
                    return ''
                }
            }

            setForm({
                title: initialData.title,
                description: initialData.description,
                target: initialData.target || '',
                type: initialData.type,
                priority: initialData.priority,
                status: initialData.status,
                assignedTo: initialData.assignedTo,
                teamIds: initialData.teamIds || [],
                startDate: formatDate(initialData.startDate.toString()),
                endDate: formatDate(initialData.endDate.toString()),
            })
        }
    }, [initialData])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleAssignmentChange = (userId: string) => {
        setForm(prev => ({
            ...prev,
            assignedTo: prev.assignedTo.includes(userId)
                ? prev.assignedTo.filter(id => id !== userId)
                : [...prev.assignedTo, userId]
        }))
    }

    const handleTeamAssignmentChange = (teamId: string) => {
        setForm(prev => ({
            ...prev,
            teamIds: prev.teamIds.includes(teamId)
                ? prev.teamIds.filter(id => id !== teamId)
                : [...prev.teamIds, teamId]
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)

        try {
            const kraData = {
                ...form,
                startDate: new Date(form.startDate),
                endDate: new Date(form.endDate),
                assignedTo: form.assignedTo.length > 0 ? form.assignedTo : [user.uid],
                teamIds: form.teamIds,
                createdBy: user.uid,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            if (isEdit && initialData) {
                await updateKRA(initialData.id, {
                    ...kraData,
                    updatedAt: new Date()
                })
            } else {
                await createKRA(kraData as any)
            }
            onSaved()
        } catch (err) {
            console.error(err)
            alert('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-6 flex justify-between items-center text-white">
                    <h2 className="text-xl font-bold">{isEdit ? '✏️ Edit Goal' : '✨ Create New Goal'}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Goal Title</label>
                        <div className="relative">
                            <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                            <input
                                name="title"
                                required
                                placeholder="e.g., Q4 Sales Targets"
                                className="w-full py-3 pl-12 pr-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300"
                                value={form.title}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                        <div className="relative">
                            <FileText className="absolute left-4 top-4 w-4 h-4 text-gray-400 z-10" />
                            <textarea
                                name="description"
                                required
                                placeholder="Describe the objectives and scope..."
                                className="w-full py-3 pl-12 pr-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300 h-24 resize-none"
                                value={form.description}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Target */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Goal</label>
                        <div className="relative">
                            <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                            <input
                                name="target"
                                required
                                placeholder="e.g., Increase revenue by 20%"
                                className="w-full py-3 pl-12 pr-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300"
                                value={form.target}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Type and Priority Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Type
                            </label>
                            <select
                                name="type"
                                value={form.type}
                                onChange={handleChange}
                                className="w-full py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300"
                                required
                            >
                                <option value="daily">📅 Daily</option>
                                <option value="weekly">📆 Weekly</option>
                                <option value="monthly">🗓️ Monthly</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Priority
                            </label>
                            <select
                                name="priority"
                                value={form.priority}
                                onChange={handleChange}
                                className="w-full py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300"
                                required
                            >
                                <option value="low">🟢 Low</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="high">🟠 High</option>
                                <option value="critical">🔴 Critical</option>
                            </select>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                        <select
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            className="w-full py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300"
                            required
                        >
                            <option value="not_started">⚪ Not Started</option>
                            <option value="in_progress">🔵 In Progress</option>
                            <option value="completed">✅ Completed</option>
                        </select>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                <input
                                    type="date"
                                    name="startDate"
                                    required
                                    className="w-full py-3 pl-12 pr-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300"
                                    value={form.startDate}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                                <input
                                    type="date"
                                    name="endDate"
                                    required
                                    className="w-full py-3 pl-12 pr-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-300"
                                    value={form.endDate}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Assign to Users (Admin/Manager only) */}
                    {hasAssignmentPermission && users.length > 0 && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Assign To
                            </label>
                            <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                                {users.map(u => (
                                    <label key={u.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                        <input
                                            type="checkbox"
                                            checked={form.assignedTo.includes(u.id)}
                                            onChange={() => handleAssignmentChange(u.id)}
                                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-gray-700">{u.fullName} ({u.role})</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Assign to Teams (Admin/Manager only) */}
                    {hasAssignmentPermission && teams.length > 0 && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Assign to Teams
                            </label>
                            <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                                {teams.map(team => (
                                    <label key={team.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                        <input
                                            type="checkbox"
                                            checked={form.teamIds.includes(team.id)}
                                            onChange={() => handleTeamAssignmentChange(team.id)}
                                            className="w-4 h-4 text-secondary-600 rounded focus:ring-secondary-500"
                                        />
                                        <div className="flex-1">
                                            <span className="text-sm font-medium text-gray-700">{team.name}</span>
                                            <span className="text-xs text-gray-500 ml-2">({team.memberIds.length} members)</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Team assignments will automatically include all current team members
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex items-center px-6 py-2.5"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                isEdit ? 'Save Changes' : 'Create Goal'
                            )}
                        </button>
                    </div>
                </form>
                </div>
            </div>
        </div>
    )
}

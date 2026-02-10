'use client'

import { useState, useEffect } from 'react'
import { KRA } from '@/types'
import { createKPI, updateKPI, getKPIsByKRA } from '@/lib/kpiService'
import { getAllUsers } from '@/lib/userService'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, Trash2, Save, Target, TrendingUp, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'

interface Props {
    kra: KRA
    onClose: () => void
}

interface LocalKPI {
    id?: string
    userId: string
    userName: string
    name: string
    benchmark: number
    lastWeekActual: number
    currentWeekPlanned: number
    currentWeekActual: number
    nextWeekTarget: number
    isNew?: boolean
}

export default function KPIEditor({ kra, onClose }: Props) {
    const { user } = useAuth()
    const [kpis, setKpis] = useState<LocalKPI[]>([])
    const [users, setUsers] = useState<{ id: string; fullName: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadData()
    }, [kra.id])

    const loadData = async () => {
        try {
            setLoading(true)
            const [kpisData, usersData] = await Promise.all([
                getKPIsByKRA(kra.id),
                getAllUsers()
            ])

            setKpis(kpisData.map(k => ({
                id: k.id,
                userId: k.userId,
                userName: k.userName,
                name: k.name,
                benchmark: k.benchmark,
                lastWeekActual: k.lastWeekActual,
                currentWeekPlanned: k.currentWeekPlanned,
                currentWeekActual: k.currentWeekActual,
                nextWeekTarget: k.nextWeekTarget,
            })))

            setUsers(usersData.map((u: any) => ({ id: u.id, fullName: u.fullName || u.email })))
        } catch (error) {
            console.error('Failed to load KPIs:', error)
            toast.error('Failed to load KPIs')
        } finally {
            setLoading(false)
        }
    }

    const addKPI = () => {
        const defaultUser = users.find(u => kra.assignedTo.includes(u.id)) || users[0]
        if (!defaultUser) {
            toast.error('No users available to assign KPI')
            return
        }

        setKpis([...kpis, {
            userId: defaultUser.id,
            userName: defaultUser.fullName,
            name: '',
            benchmark: 100,
            lastWeekActual: 0,
            currentWeekPlanned: 0,
            currentWeekActual: 0,
            nextWeekTarget: 0,
            isNew: true,
        }])
    }

    const removeKPI = (index: number) => {
        setKpis(kpis.filter((_, i) => i !== index))
    }

    const updateLocalKPI = (index: number, field: keyof LocalKPI, value: any) => {
        setKpis(kpis.map((kpi, i) => {
            if (i !== index) return kpi
            if (field === 'userId') {
                const selectedUser = users.find(u => u.id === value)
                return {
                    ...kpi,
                    userId: value,
                    userName: selectedUser?.fullName || '',
                }
            }
            return { ...kpi, [field]: value }
        }))
    }

    const handleSave = async () => {
        if (!user) return

        setSaving(true)
        try {
            const now = new Date()
            // Get Monday of current week
            const dayOfWeek = now.getDay()
            const monday = new Date(now)
            monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
            monday.setHours(0, 0, 0, 0)

            for (const kpi of kpis) {
                if (kpi.isNew) {
                    await createKPI({
                        kraId: kra.id,
                        userId: kpi.userId,
                        userName: kpi.userName,
                        name: kpi.name,
                        benchmark: kpi.benchmark,
                        lastWeekActual: kpi.lastWeekActual,
                        currentWeekPlanned: kpi.currentWeekPlanned,
                        currentWeekActual: kpi.currentWeekActual,
                        nextWeekTarget: kpi.nextWeekTarget,
                        weekStartDate: monday,
                        updatedBy: user.uid,
                    })
                } else if (kpi.id) {
                    await updateKPI(kpi.id, {
                        userId: kpi.userId,
                        userName: kpi.userName,
                        name: kpi.name,
                        benchmark: kpi.benchmark,
                        lastWeekActual: kpi.lastWeekActual,
                        currentWeekPlanned: kpi.currentWeekPlanned,
                        currentWeekActual: kpi.currentWeekActual,
                        nextWeekTarget: kpi.nextWeekTarget,
                        updatedBy: user.uid,
                    })
                }
            }

            toast.success('KPIs saved successfully')
            onClose()
        } catch (error) {
            console.error('Failed to save KPIs:', error)
            toast.error('Failed to save KPIs')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading KPIs...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Target className="w-6 h-6" />
                            Manage KPIs
                        </h2>
                        <p className="text-purple-100 text-sm mt-1">KRA: {kra.title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {kpis.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">No KPIs defined yet</p>
                            <p className="text-gray-400 text-sm mt-1">Add a KPI to start tracking performance</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {kpis.map((kpi, index) => (
                                <div key={kpi.id || index} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">KPI Name</label>
                                                <Input
                                                    value={kpi.name}
                                                    onChange={(e) => updateLocalKPI(index, 'name', e.target.value)}
                                                    placeholder="e.g., % work completed"
                                                    className="h-10"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Employee</label>
                                                <select
                                                    value={kpi.userId}
                                                    onChange={(e) => updateLocalKPI(index, 'userId', e.target.value)}
                                                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-sm"
                                                >
                                                    {users.map(u => (
                                                        <option key={u.id} value={u.id}>{u.fullName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeKPI(index)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-5 gap-3">
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Benchmark</label>
                                            <Input
                                                type="number"
                                                value={kpi.benchmark}
                                                onChange={(e) => updateLocalKPI(index, 'benchmark', parseFloat(e.target.value) || 0)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Last Week %</label>
                                            <Input
                                                type="number"
                                                value={kpi.lastWeekActual}
                                                onChange={(e) => updateLocalKPI(index, 'lastWeekActual', parseFloat(e.target.value) || 0)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">This Week Plan</label>
                                            <Input
                                                type="number"
                                                value={kpi.currentWeekPlanned}
                                                onChange={(e) => updateLocalKPI(index, 'currentWeekPlanned', parseFloat(e.target.value) || 0)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">This Week Actual</label>
                                            <Input
                                                type="number"
                                                value={kpi.currentWeekActual}
                                                onChange={(e) => updateLocalKPI(index, 'currentWeekActual', parseFloat(e.target.value) || 0)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Next Week Target</label>
                                            <Input
                                                type="number"
                                                value={kpi.nextWeekTarget}
                                                onChange={(e) => updateLocalKPI(index, 'nextWeekTarget', parseFloat(e.target.value) || 0)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <Button
                        variant="outline"
                        onClick={addKPI}
                        className="w-full mt-4 h-12 border-dashed border-2 text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add KPI
                    </Button>
                </div>

                {/* Footer */}
                <div className="border-t bg-gray-50 px-6 py-4 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save KPIs
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

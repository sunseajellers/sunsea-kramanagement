'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ScoringConfig as IScoringConfig } from '@/types'
import { Loader2, Award, Info, RotateCcw, CheckCircle, XCircle } from 'lucide-react'
import { authenticatedJsonFetch } from '@/lib/apiClient'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

export default function ScoringConfig() {
    const { user, loading: authLoading } = useAuth()
    const [, setConfig] = useState<IScoringConfig | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        completionWeight: 40,
        timelinessWeight: 30,
        qualityWeight: 20,
        kraAlignmentWeight: 10
    })

    useEffect(() => {
        if (!authLoading && user) {
            loadConfig()
        }
    }, [authLoading, user])

    const loadConfig = async () => {
        if (!user) return
        setLoading(true)
        try {
            const result = await authenticatedJsonFetch('/api/scoring/config', {
                headers: {
                    'x-user-id': user.uid
                }
            })
            if (result.success && result.data) {
                const data = result.data
                setConfig(data)
                setFormData({
                    completionWeight: data.completionWeight,
                    timelinessWeight: data.timelinessWeight,
                    qualityWeight: data.qualityWeight,
                    kraAlignmentWeight: data.kraAlignmentWeight
                })
            } else {
                throw new Error(result.error)
            }
        } catch (error) {
            console.error('Failed to load scoring config', error)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (field: keyof typeof formData, value: number) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const getTotalWeight = () => {
        return Object.values(formData).reduce((sum, val) => sum + val, 0)
    }

    const handleSave = async () => {
        if (!user) return

        const total = getTotalWeight()
        if (total !== 100) {
            toast.error(`Total weight must equal 100%. Current total: ${total}%`)
            return
        }

        setSaving(true)
        try {
            const result = await authenticatedJsonFetch('/api/scoring/config', {
                method: 'PUT',
                headers: {
                    'x-user-id': user.uid
                },
                body: JSON.stringify({
                    config: {
                        ...formData,
                        updatedAt: new Date(),
                        updatedBy: user.uid
                    }
                })
            })

            if (result.success) {
                await loadConfig()
                toast.success('Scoring configuration updated!')
            } else {
                throw new Error(result.error || 'Failed to update scoring config')
            }
        } catch (error) {
            console.error('Failed to update scoring config', error)
            toast.error('Failed to update scoring configuration.')
        } finally {
            setSaving(false)
        }
    }

    const handleReset = () => {
        setFormData({
            completionWeight: 40,
            timelinessWeight: 30,
            qualityWeight: 20,
            kraAlignmentWeight: 10
        })
        toast.success('Reset to defaults (not saved)')
    }

    if (loading || authLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center animate-pulse">
                        <Award className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Loading configuration...</p>
                </div>
            </div>
        )
    }

    const totalWeight = getTotalWeight()
    const isValid = totalWeight === 100

    const weightItems = [
        { id: 'completionWeight', label: 'Task Completion', desc: 'Speed of completing assigned tasks', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-500' },
        { id: 'timelinessWeight', label: 'Timeliness', desc: 'Meeting deadlines consistently', color: 'from-indigo-500 to-purple-500', bgColor: 'bg-indigo-500' },
        { id: 'qualityWeight', label: 'Quality', desc: 'Checklist completion and accuracy', color: 'from-cyan-500 to-teal-500', bgColor: 'bg-cyan-500' },
        { id: 'kraAlignmentWeight', label: 'KRA Alignment', desc: 'Connection to key objectives', color: 'from-emerald-500 to-green-500', bgColor: 'bg-emerald-500' }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Scoring Algorithm</h2>
                    <p className="text-gray-400 text-xs font-medium">Define weights for performance calculation</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleReset} className="h-9 px-4 rounded-xl text-xs font-medium border-gray-200">
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        Reset
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || !isValid}
                        className="h-9 px-4 bg-gray-900 hover:bg-black rounded-xl text-xs font-medium disabled:opacity-40"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Configuration'}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weight Configuration */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Info Notice */}
                    <div className="glass-card p-4 flex items-start gap-3">
                        <div className="icon-box icon-box-sm bg-blue-50 text-blue-500 flex-shrink-0">
                            <Info className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-700">Weight Balancing</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Performance scores are calculated from four weighted factors. Adjust the sliders below. Total must equal 100%.
                            </p>
                        </div>
                    </div>

                    {/* Weight Sliders */}
                    <div className="glass-card p-6 space-y-8">
                        {weightItems.map((item) => (
                            <div key={item.id} className="space-y-4">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <label className="text-sm font-bold text-gray-900">{item.label}</label>
                                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                                    </div>
                                    <div className="text-2xl font-black text-gray-900">
                                        {formData[item.id as keyof typeof formData]}%
                                    </div>
                                </div>
                                <div className="relative">
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${item.color} transition-all duration-300 rounded-full shadow-sm`}
                                            style={{ width: `${formData[item.id as keyof typeof formData]}%` }}
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={formData[item.id as keyof typeof formData]}
                                        onChange={(e) => handleChange(item.id as keyof typeof formData, parseInt(e.target.value))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status Panel */}
                <div className="space-y-6">
                    {/* Validation Status */}
                    <div className={`glass-card p-8 text-center ${!isValid ? 'ring-2 ring-red-200' : ''}`}>
                        <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${isValid ? 'bg-green-50' : 'bg-red-50'}`}>
                            {isValid ? (
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            ) : (
                                <XCircle className="w-8 h-8 text-red-500" />
                            )}
                        </div>
                        <p className="text-xs text-gray-400 font-medium mb-1">Current Balance</p>
                        <h3 className={`text-4xl font-black mb-3 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                            {totalWeight}%
                        </h3>
                        <span className={`badge ${isValid ? 'badge-success py-1' : 'badge-danger py-1'}`}>
                            {isValid ? 'VALID' : 'INVALID'}
                        </span>
                    </div>

                    {/* Weight Distribution */}
                    <div className="glass-card p-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Distribution Map</h3>
                        <div className="space-y-4">
                            {weightItems.map((item) => {
                                const value = formData[item.id as keyof typeof formData]
                                return (
                                    <div key={item.id} className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${item.bgColor}`} />
                                        <span className="text-xs font-bold text-gray-600 flex-1">{item.label}</span>
                                        <span className="text-xs font-black text-gray-900">{value}%</span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Visual Bar */}
                        <div className="mt-8 h-6 rounded-2xl overflow-hidden flex shadow-inner border border-gray-50">
                            {weightItems.map((item) => {
                                const value = formData[item.id as keyof typeof formData]
                                return (
                                    <div
                                        key={item.id}
                                        className={`h-full ${item.bgColor} transition-all duration-300`}
                                        style={{ width: `${value}%` }}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

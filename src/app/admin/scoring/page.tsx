'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ScoringConfig } from '@/types'
import { Loader2, Award, Info, RotateCcw } from 'lucide-react'
import { authenticatedJsonFetch } from '@/lib/apiClient'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

export default function AdminScoringPage() {
    const { user } = useAuth()
    const [config, setConfig] = useState<ScoringConfig | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        completionWeight: 40,
        timelinessWeight: 30,
        qualityWeight: 20,
        kraAlignmentWeight: 10
    })

    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = async () => {
        setLoading(true)
        try {
            const result = await authenticatedJsonFetch('/api/scoring/config', {
                headers: {
                    'x-user-id': user!.uid
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Configuration...</p>
            </div>
        )
    }

    const totalWeight = getTotalWeight()
    const isValid = totalWeight === 100

    return (
        <div className="space-y-10 pb-12">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Performance Logic</h1>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Award className="h-3 w-3 text-blue-500" />
                        Configure scoring weights and calculation variables
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleReset}
                        className="h-11 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-900 hover:bg-white"
                    >
                        <RotateCcw className="w-4 h-4 mr-2 opacity-50" />
                        Restore Defaults
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || !isValid}
                        className="h-11 bg-gray-900 hover:bg-black text-white px-10 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm disabled:opacity-30"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deploy Configuration'}
                    </Button>
                </div>
            </div>

            {/* Info Notice */}
            <div className="bg-blue-50/30 border border-blue-100/50 rounded-2xl p-6 flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-white border border-blue-100 flex items-center justify-center text-blue-500 shrink-0 shadow-sm">
                    <Info className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Logic Protocol</p>
                    <p className="text-xs text-blue-900/60 font-bold leading-relaxed max-w-2xl">
                        Performance scores are derived from four weighted vectors. Adjust distribution below to align with organizational priorities.
                        <span className="text-blue-600 ml-1 underline decoration-2 underline-offset-4">Distribution total must equal exactly 100%.</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Matrix */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Weight Distribution Matrix</h2>
                    <div className="bg-white border border-gray-100 rounded-3xl p-8 space-y-10 shadow-sm">
                        {[
                            { id: 'completionWeight', label: 'TASK COMPLETION', desc: 'Velocity of assigned task closure', color: 'bg-blue-500' },
                            { id: 'timelinessWeight', label: 'TEMPORAL PRECISION', desc: 'Alignment with projected deadlines', color: 'bg-indigo-500' },
                            { id: 'qualityWeight', label: 'OUTPUT FIDELITY', desc: 'Verification of checklist compliance', color: 'bg-cyan-500' },
                            { id: 'kraAlignmentWeight', label: 'STRATEGIC ALIGNMENT', desc: 'Direct linkage to KRA objectives', color: 'bg-emerald-500' }
                        ].map((item) => (
                            <div key={item.id} className="space-y-4 group">
                                <div className="flex items-end justify-between">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-900 uppercase tracking-[0.15em]">
                                            {item.label}
                                        </label>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                            {item.desc}
                                        </p>
                                    </div>
                                    <div className="text-2xl font-black text-gray-900 tracking-tighter">
                                        {formData[item.id as keyof typeof formData]}<span className="text-sm text-gray-300 ml-0.5">%</span>
                                    </div>
                                </div>
                                <div className="relative pt-2">
                                    <div className="flex h-1.5 overflow-hidden bg-gray-50 rounded-full">
                                        <div
                                            style={{ width: `${formData[item.id as keyof typeof formData]}%` }}
                                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${item.color} transition-all duration-500 ease-out rounded-full`}
                                        ></div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={formData[item.id as keyof typeof formData]}
                                        onChange={(e) => handleChange(item.id as keyof typeof formData, parseInt(e.target.value))}
                                        className="absolute top-1 left-0 w-full h-3 opacity-0 cursor-pointer z-10"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Validation & Stats */}
                <div className="space-y-6">
                    <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Verification Status</h2>
                    <Card className={`border-none shadow-sm rounded-3xl overflow-hidden transition-all duration-500 ${isValid ? 'bg-white' : 'bg-red-50/30'}`}>
                        <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${isValid ? 'bg-green-50 text-green-500 scale-100' : 'bg-red-100 text-red-500 scale-110'}`}>
                                <Award className={`w-10 h-10 ${isValid ? '' : 'animate-pulse'}`} />
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Aggregate Total</p>
                                <h3 className={`text-5xl font-black tracking-tighter ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                                    {totalWeight}<span className="text-xl opacity-30">%</span>
                                </h3>
                            </div>

                            <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${isValid ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-100 text-red-600 border-red-200 animate-bounce'}`}>
                                {isValid ? 'Validation Confirmed' : 'Sync Required (100%)'}
                            </div>

                            {!isValid && (
                                <p className="text-[10px] text-red-400 font-bold uppercase leading-relaxed px-4">
                                    Configuration cannot be deployed until aggregate distribution equals 100%.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {config && (
                        <div className="px-4 text-center">
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">
                                Last system update: {new Date(config.updatedAt).toLocaleDateString()}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

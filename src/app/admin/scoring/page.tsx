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
    const { user, loading: authLoading } = useAuth()
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
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-sm text-gray-500">Loading Configuration...</p>
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
                    <h1 className="text-2xl font-bold text-gray-900">Scoring Configuration</h1>
                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                        <Award className="h-3.5 w-3.5 text-blue-500" />
                        Configure scoring weights and calculation variables
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleReset}
                        className="h-10 px-5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset Defaults
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || !isValid}
                        className="h-10 bg-gray-900 hover:bg-black text-white px-6 rounded-lg text-sm font-medium shadow-sm disabled:opacity-30"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Configuration'}
                    </Button>
                </div>
            </div>

            {/* Info Notice */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                    <Info className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-blue-700">How Scoring Works</p>
                    <p className="text-sm text-blue-600/80 leading-relaxed">
                        Performance scores are calculated from four weighted factors. Adjust the sliders to match your priorities.
                        <span className="font-medium ml-1">Total must equal 100%.</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Matrix */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-700 ml-1">Weight Distribution</h2>
                    <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-8 shadow-sm">
                        {[
                            { id: 'completionWeight', label: 'Task Completion', desc: 'Speed of completing assigned tasks', color: 'bg-blue-500' },
                            { id: 'timelinessWeight', label: 'Timeliness', desc: 'Meeting deadlines consistently', color: 'bg-indigo-500' },
                            { id: 'qualityWeight', label: 'Quality', desc: 'Checklist completion and accuracy', color: 'bg-cyan-500' },
                            { id: 'kraAlignmentWeight', label: 'KRA Alignment', desc: 'Connection to key objectives', color: 'bg-emerald-500' }
                        ].map((item) => (
                            <div key={item.id} className="space-y-3">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <label className="text-sm font-medium text-gray-900">
                                            {item.label}
                                        </label>
                                        <p className="text-xs text-gray-500">
                                            {item.desc}
                                        </p>
                                    </div>
                                    <div className="text-xl font-bold text-gray-900">
                                        {formData[item.id as keyof typeof formData]}%
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
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-gray-700 ml-1">Status</h2>
                    <Card className={`border shadow-sm rounded-xl overflow-hidden transition-all ${isValid ? 'bg-white border-gray-100' : 'bg-red-50 border-red-100'}`}>
                        <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isValid ? 'bg-green-50 text-green-500' : 'bg-red-100 text-red-500'}`}>
                                <Award className={`w-8 h-8 ${isValid ? '' : 'animate-pulse'}`} />
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs text-gray-500">Total Weight</p>
                                <h3 className={`text-4xl font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                                    {totalWeight}%
                                </h3>
                            </div>

                            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {isValid ? '✓ Valid Configuration' : 'Must equal 100%'}
                            </div>

                            {!isValid && (
                                <p className="text-xs text-red-500">
                                    Adjust weights to total 100%.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {config && (
                        <div className="px-2 text-center">
                            <span className="text-xs text-gray-400">
                                Last updated: {new Date(config.updatedAt).toLocaleDateString()}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

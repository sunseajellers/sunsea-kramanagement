'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ScoringConfig } from '@/types'
import { Settings, Save, Loader2, Award, Info } from 'lucide-react'
import { authenticatedJsonFetch } from '@/lib/apiClient'

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
            alert(`Total weight must equal 100%. Current total: ${total}%`)
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
                alert('Scoring configuration updated successfully!')
            } else {
                throw new Error(result.error || 'Failed to update scoring config')
            }
        } catch (error) {
            console.error('Failed to update scoring config', error)
            alert('Failed to update scoring configuration. Please try again.')
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
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600 mb-4" />
                <p className="text-gray-500 font-medium">Loading configuration...</p>
            </div>
        )
    }

    const totalWeight = getTotalWeight()
    const isValid = totalWeight === 100

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3 mb-2">
                    <Settings className="w-8 h-8 text-primary-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Scoring Configuration</h1>
                </div>
                <p className="text-gray-500">
                    Configure the weights for calculating employee performance scores
                </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">How Scoring Works</p>
                    <p>
                        Employee scores are calculated based on four factors. Adjust the weights below to determine
                        how much each factor contributes to the overall score. The total must equal 100%.
                    </p>
                </div>
            </div>

            {/* Configuration Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="space-y-6">
                    {/* Completion Weight */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900">
                                    Task Completion Weight
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Based on the percentage of assigned tasks completed
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-primary-600">
                                    {formData.completionWeight}%
                                </span>
                            </div>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={formData.completionWeight}
                            onChange={(e) => handleChange('completionWeight', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                        />
                    </div>

                    {/* Timeliness Weight */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900">
                                    Timeliness Weight
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Based on the percentage of tasks completed before the due date
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-blue-600">
                                    {formData.timelinessWeight}%
                                </span>
                            </div>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={formData.timelinessWeight}
                            onChange={(e) => handleChange('timelinessWeight', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>

                    {/* Quality Weight */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900">
                                    Quality Weight
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Based on checklist completion and task thoroughness
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-green-600">
                                    {formData.qualityWeight}%
                                </span>
                            </div>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={formData.qualityWeight}
                            onChange={(e) => handleChange('qualityWeight', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                        />
                    </div>

                    {/* KRA Alignment Weight */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900">
                                    KRA Alignment Weight
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Based on the percentage of tasks linked to KRAs
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-purple-600">
                                    {formData.kraAlignmentWeight}%
                                </span>
                            </div>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={formData.kraAlignmentWeight}
                            onChange={(e) => handleChange('kraAlignmentWeight', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                    </div>
                </div>

                {/* Total Weight Indicator */}
                <div className={`mt-6 p-4 rounded-xl border-2 ${isValid
                        ? 'bg-green-50 border-green-300'
                        : 'bg-red-50 border-red-300'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Award className={`w-5 h-5 ${isValid ? 'text-green-600' : 'text-red-600'}`} />
                            <span className={`font-semibold ${isValid ? 'text-green-900' : 'text-red-900'}`}>
                                Total Weight
                            </span>
                        </div>
                        <div>
                            <span className={`text-3xl font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                                {totalWeight}%
                            </span>
                        </div>
                    </div>
                    {!isValid && (
                        <p className="text-sm text-red-700 mt-2">
                            Total must equal 100%. Please adjust the weights.
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                        onClick={handleReset}
                        className="px-5 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                    >
                        Reset to Default
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !isValid}
                        className="btn-primary flex items-center px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                Save Configuration
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Current Configuration Display */}
            {config && (
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Current Active Configuration</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white p-3 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Completion</p>
                            <p className="text-xl font-bold text-primary-600">{config.completionWeight}%</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Timeliness</p>
                            <p className="text-xl font-bold text-blue-600">{config.timelinessWeight}%</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Quality</p>
                            <p className="text-xl font-bold text-green-600">{config.qualityWeight}%</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">KRA Alignment</p>
                            <p className="text-xl font-bold text-purple-600">{config.kraAlignmentWeight}%</p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                        Last updated: {new Date(config.updatedAt).toLocaleString()}
                    </p>
                </div>
            )}
        </div>
    )
}

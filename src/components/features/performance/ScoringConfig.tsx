'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ScoringConfig as IScoringConfig } from '@/types'
import { Loader2, Award, Info, RotateCcw, CheckCircle, XCircle } from 'lucide-react'
import { authenticatedJsonFetch } from '@/lib/apiClient'
import { cn } from '@/lib/utils'
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
        <div className="space-y-10 animate-in">
            {/* Page Header */}
            <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="section-title">Scoring Logic Matrix</h2>
                    <p className="section-subtitle">Define algorithmic weights for performance and efficiency computation</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleReset}
                        className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset Defaults
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || !isValid}
                        className="btn-primary h-12 px-8 min-w-[200px]"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authorize Logic'}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Weight Configuration */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Strategic Guidance */}
                    <div className="glass-panel p-6 flex items-start gap-5 border-l-4 border-l-indigo-500 bg-indigo-50/10">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0 border border-indigo-100 shadow-sm">
                            <Award className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Algorithmic Balancing</p>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                                Performance scores are derived from four weighted vectors. Adjust the deployment intensity below. Final coefficient must aggregate precisely to <span className="text-indigo-600 font-black">100%</span>.
                            </p>
                        </div>
                    </div>

                    {/* Weight Sliders */}
                    <div className="glass-panel p-10 space-y-12">
                        {weightItems.map((item) => (
                            <div key={item.id} className="space-y-5 group/slider">
                                <div className="flex items-end justify-between">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</label>
                                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover/slider:text-indigo-600 transition-colors">{item.desc}</p>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-slate-900 tracking-tighter">
                                            {formData[item.id as keyof typeof formData]}
                                        </span>
                                        <span className="text-xs font-black text-slate-400 uppercase">%</span>
                                    </div>
                                </div>
                                <div className="relative pt-2">
                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-50">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-500 shadow-lg",
                                                `bg-gradient-to-r ${item.color}`
                                            )}
                                            style={{ width: `${formData[item.id as keyof typeof formData]}%` }}
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={formData[item.id as keyof typeof formData]}
                                        onChange={(e) => handleChange(item.id as keyof typeof formData, parseInt(e.target.value))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    {/* Tick Marks */}
                                    <div className="flex justify-between px-1 mt-3">
                                        {[0, 25, 50, 75, 100].map(val => (
                                            <span key={val} className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{val}%</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status Panel */}
                <div className="space-y-8">
                    {/* Validation Feedback */}
                    <div className={cn(
                        "glass-panel p-10 text-center transition-all duration-500 border-2",
                        isValid ? 'border-emerald-100 shadow-emerald-100/20' : 'border-rose-100 shadow-rose-100/20 animate-pulse'
                    )}>
                        <div className={cn(
                            "w-20 h-20 mx-auto rounded-[2rem] flex items-center justify-center mb-6 shadow-xl ring-8 ring-white transition-all transform",
                            isValid ? 'bg-emerald-50 text-emerald-500 scale-100' : 'bg-rose-50 text-rose-500 scale-95'
                        )}>
                            {isValid ? (
                                <CheckCircle className="w-10 h-10" />
                            ) : (
                                <XCircle className="w-10 h-10" />
                            )}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Aggregated Coefficient</p>
                        <h3 className={cn(
                            "text-6xl font-black mb-4 tracking-tighter",
                            isValid ? 'text-emerald-600' : 'text-rose-600'
                        )}>
                            {totalWeight}%
                        </h3>
                        <span className={cn(
                            "status-badge",
                            isValid ? "status-badge-success" : "status-badge-danger"
                        )}>
                            {isValid ? 'VALID EQUILIBRIUM' : 'RECALIBRATION REQUIRED'}
                        </span>
                    </div>

                    {/* Distribution Map */}
                    <div className="glass-panel p-8">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 leading-none">Visual Allocation Map</h3>
                        <div className="space-y-5">
                            {weightItems.map((item) => {
                                const value = formData[item.id as keyof typeof formData]
                                return (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <div className={cn("w-3 h-3 rounded-full shadow-sm ring-2 ring-white", item.bgColor)} />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex-1">{item.label}</span>
                                        <span className="text-xs font-black text-slate-900 font-mono">{value}%</span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Integrated Bar */}
                        <div className="mt-10 h-10 rounded-[1.25rem] overflow-hidden flex shadow-2xl shadow-indigo-100 ring-4 ring-white border border-slate-100">
                            {weightItems.map((item) => {
                                const value = formData[item.id as keyof typeof formData]
                                return (
                                    <div
                                        key={item.id}
                                        className={cn("h-full transition-all duration-700", item.bgColor)}
                                        style={{ width: `${value}%` }}
                                    />
                                )
                            })}
                        </div>
                        <p className="text-[9px] font-medium text-slate-400 italic text-center mt-4">Proportional mapping of performance indices</p>
                    </div>

                    {/* Legend Info */}
                    <div className="glass-panel p-6 bg-slate-50/50">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                                <Info className="w-4 h-4 text-slate-400" />
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                Configuration updates are logged in the <span className="font-bold text-slate-700">Audit Trail</span> and take effect immediately across all calculations.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

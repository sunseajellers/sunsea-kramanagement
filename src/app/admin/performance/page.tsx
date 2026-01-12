// Simple admin page for managing performance parameters
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { PerformanceParameter } from '@/types'
import {
    getAllPerformanceParameters,
    createPerformanceParameter,
    updatePerformanceParameter,
    deletePerformanceParameter,
    initializeDefaultParameters
} from '@/lib/performanceService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, X, BarChart, Settings2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PerformanceParametersPage() {
    const { user } = useAuth()
    const [parameters, setParameters] = useState<PerformanceParameter[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [initializing, setInitializing] = useState(false)

    useEffect(() => {
        loadParameters()
    }, [])

    const loadParameters = async () => {
        try {
            const data = await getAllPerformanceParameters()
            setParameters(data)
        } catch (error) {
            console.error('Failed to load parameters:', error)
            toast.error('Failed to load parameters')
        } finally {
            setLoading(false)
        }
    }

    const handleInitializeDefaults = async () => {
        if (!user) return
        if (!confirm('Initialize default performance parameters?')) return

        setInitializing(true)
        try {
            await initializeDefaultParameters(user.uid)
            toast.success('Default parameters created!')
            loadParameters()
        } catch (error) {
            console.error('Failed to initialize:', error)
            toast.error('Failed to initialize parameters')
        } finally {
            setInitializing(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this parameter?')) return

        try {
            await deletePerformanceParameter(id)
            toast.success('Parameter deleted')
            loadParameters()
        } catch (error) {
            console.error('Failed to delete:', error)
            toast.error('Failed to delete parameter')
        }
    }

    const handleToggleActive = async (param: PerformanceParameter) => {
        try {
            await updatePerformanceParameter(param.id, { isActive: !param.isActive })
            toast.success(param.isActive ? 'Parameter deactivated' : 'Parameter activated')
            loadParameters()
        } catch (error) {
            console.error('Failed to update:', error)
            toast.error('Failed to update parameter')
        }
    }

    const totalWeight = parameters.filter(p => p.isActive).reduce((sum, p) => sum + p.weight, 0)

    return (
        <div className="space-y-6">
            {/* Header - Simplified */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <Settings2 className="h-7 w-7 text-blue-600" />
                        Performance Parameters
                    </h1>
                    <p className="text-sm text-gray-400 font-medium mt-1">Manage scoring criteria for MIS tracking</p>
                </div>
                <div className="flex gap-2">
                    {parameters.length === 0 && (
                        <Button
                            variant="outline"
                            onClick={handleInitializeDefaults}
                            disabled={initializing}
                            className="h-10 border-gray-100 text-[10px] font-black uppercase tracking-widest rounded-xl"
                        >
                            {initializing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Initialize Defaults
                        </Button>
                    )}
                    <Button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="h-10 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
                    >
                        {showCreateForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        {showCreateForm ? 'Cancel' : 'Add Parameter'}
                    </Button>
                </div>
            </div>

            {/* Weight Summary - Simplified */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${totalWeight === 100 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                            <BarChart className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Active Weight</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-black text-gray-900">{totalWeight}%</span>
                                {totalWeight !== 100 && (
                                    <span className="text-[10px] font-bold text-orange-600 uppercase">Should equal 100%</span>
                                )}
                            </div>
                        </div>
                    </div>
                    {totalWeight === 100 && (
                        <div className="px-3 py-1 bg-green-50 rounded-full border border-green-100">
                            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">System Balanced</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Form - Simplified */}
            {showCreateForm && (
                <Card className="border-none shadow-sm bg-white animate-slide-up">
                    <CardHeader className="border-b bg-gray-50/30 px-6 py-4">
                        <CardTitle className="text-sm font-black text-gray-900 uppercase tracking-widest">New Parameter</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <CreateParameterForm
                            onClose={() => setShowCreateForm(false)}
                            onSuccess={() => {
                                setShowCreateForm(false)
                                loadParameters()
                            }}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Parameters Table - Simplified */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Parameter</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Weight</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Range</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Loading Parameters...</p>
                                        </td>
                                    </tr>
                                ) : parameters.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <Settings2 className="w-8 h-8 text-gray-300" />
                                            </div>
                                            <p className="text-sm font-black text-gray-900 uppercase tracking-widest">No Parameters Found</p>
                                            <p className="text-xs text-gray-400 mt-1">Initialize defaults or create your first parameter</p>
                                        </td>
                                    </tr>
                                ) : (
                                    parameters.map((param) => (
                                        <tr key={param.id} className={`hover:bg-gray-50/50 transition-colors ${!param.isActive && 'bg-gray-50/30'}`}>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-gray-900">{param.name}</p>
                                                <p className="text-xs text-gray-400 line-clamp-1">{param.description}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest">
                                                    {param.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-lg font-black text-gray-900">{param.weight}%</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-xs font-bold text-gray-600 px-2 py-1 bg-gray-100 rounded">
                                                    {param.minScore} - {param.maxScore}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleToggleActive(param)}
                                                    className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border transition-all ${param.isActive
                                                        ? 'bg-green-50 text-green-600 border-green-100'
                                                        : 'bg-gray-100 text-gray-400 border-gray-200'
                                                        }`}
                                                >
                                                    {param.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(param.id)}
                                                    className="h-8 w-8 p-0 border-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-lg"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Simple create parameter form
function CreateParameterForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const { user } = useAuth()
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        weight: 10,
        category: 'custom' as any,
        minScore: 0,
        maxScore: 10,
        isActive: true
    })
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setSaving(true)
        try {
            await createPerformanceParameter({
                ...formData,
                createdBy: user.uid
            })
            toast.success('Parameter created!')
            onSuccess()
        } catch (error) {
            console.error('Failed to create:', error)
            toast.error('Failed to create parameter')
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Parameter Name *</Label>
                    <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-10 px-4 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</Label>
                    <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                        className="w-full h-10 px-3 py-2 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    >
                        <option value="quality">Quality</option>
                        <option value="timeliness">Timeliness</option>
                        <option value="accuracy">Accuracy</option>
                        <option value="completeness">Completeness</option>
                        <option value="efficiency">Efficiency</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</Label>
                <Input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="h-10 px-4 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Weight (%)</Label>
                    <Input
                        type="number"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                        className="h-10 px-4 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                        min="0"
                        max="100"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Min Score</Label>
                    <Input
                        type="number"
                        value={formData.minScore}
                        onChange={(e) => setFormData({ ...formData, minScore: parseInt(e.target.value) })}
                        className="h-10 px-4 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Max Score</Label>
                    <Input
                        type="number"
                        value={formData.maxScore}
                        onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) })}
                        className="h-10 px-4 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                        required
                    />
                </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="h-10 border-gray-100 text-[10px] font-black uppercase tracking-widest px-6 rounded-xl"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={saving}
                    className="h-10 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-6 rounded-xl shadow-sm"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Parameter
                </Button>
            </div>
        </form>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { KRATemplate, getAllKRATemplates, createKRATemplate, toggleKRATemplateStatus, deleteKRATemplate, generateScheduledKRAs } from '@/lib/kraAutomation'
import { Plus, Trash2, Play, Clock, Calendar, Loader2, X } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import toast from 'react-hot-toast'

export default function KRAScheduler() {
    const { user } = useAuth()
    const [templates, setTemplates] = useState<KRATemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        loadTemplates()
    }, [])

    const loadTemplates = async () => {
        try {
            const data = await getAllKRATemplates()
            setTemplates(data)
        } catch (error) {
            toast.error('Failed to load templates')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this template?')) return
        try {
            await deleteKRATemplate(id)
            toast.success('Template deleted')
            loadTemplates()
        } catch (error) {
            toast.error('Failed to delete')
        }
    }

    const handleToggle = async (id: string, isActive: boolean) => {
        try {
            await toggleKRATemplateStatus(id, !isActive)
            toast.success(isActive ? 'Deactivated' : 'Activated')
            loadTemplates()
        } catch (error) {
            toast.error('Failed to update')
        }
    }

    const handleManualGenerate = async () => {
        setGenerating(true)
        try {
            const results = await generateScheduledKRAs()
            toast.success(`Generated ${results.generated} KRAs`)
            if (results.errors.length > 0) {
                toast.error(`${results.errors.length} errors occurred`)
            }
            loadTemplates()
        } catch (error) {
            toast.error('Generation failed')
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="space-y-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Automation Engine</h2>
                    <p className="text-gray-400 text-xs font-medium flex items-center gap-1.5 mt-0.5">
                        <Calendar className="h-3 w-3 text-blue-500" />
                        Recurring KRA generation & scheduling
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleManualGenerate}
                        disabled={generating}
                        className="h-11 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-100"
                    >
                        {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2 opacity-50" />}
                        Execute Pulse
                    </Button>
                    <Button
                        onClick={() => setShowCreate(!showCreate)}
                        className={`h-11 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm ${showCreate ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-900 text-white hover:bg-black'}`}
                    >
                        {showCreate ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        {showCreate ? 'Abort Entry' : 'New Template'}
                    </Button>
                </div>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div className="animate-slide-up">
                    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xl">
                        <div className="mb-8">
                            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Configuration Input</h2>
                            <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">Define recurring objective parameters</p>
                        </div>
                        <CreateTemplateForm
                            onClose={() => setShowCreate(false)}
                            onSuccess={() => { setShowCreate(false); loadTemplates() }}
                        />
                    </div>
                </div>
            )}

            {/* Templates Data Grid */}
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-gray-50 px-8 py-6 bg-white">
                    <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Active Automation Protocols ({templates.length})</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/20 border-b border-gray-50 text-[9px] font-black text-gray-300 uppercase tracking-widest">
                                <th className="px-8 py-4 text-left">Protocol Identity</th>
                                <th className="px-6 py-4 text-center">Cycle</th>
                                <th className="px-6 py-4 text-center">Urgency</th>
                                <th className="px-6 py-4 text-center">Reach</th>
                                <th className="px-6 py-4 text-center">Last Pulse</th>
                                <th className="px-6 py-4 text-center">Active State</th>
                                <th className="px-8 py-4 text-right">Utility</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-500 mb-4 opacity-20" />
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Synchronizing Registry...</p>
                                    </td>
                                </tr>
                            ) : templates.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-24 text-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                            <Clock className="w-10 h-10 text-gray-200" />
                                        </div>
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Registry Vacant</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Initialize your first automation template to begin</p>
                                    </td>
                                </tr>
                            ) : (
                                templates.map((t) => (
                                    <tr key={t.id} className={`group hover:bg-blue-50/10 transition-all ${!t.isActive && 'opacity-40 grayscale'}`}>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-black text-gray-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{t.title}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 line-clamp-1">{t.description}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${t.priority === 'critical' ? 'bg-red-500' :
                                                    t.priority === 'high' ? 'bg-orange-500' :
                                                        t.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-300'
                                                    }`} />
                                                <span className="text-[9px] font-black text-gray-900 uppercase tracking-widest">
                                                    {t.priority}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">
                                                {t.assignedTo.length} Records
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                                {t.lastGenerated
                                                    ? new Date(t.lastGenerated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                                    : '---'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleToggle(t.id, t.isActive)}
                                                className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${t.isActive
                                                    ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'
                                                    : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {t.isActive ? 'OPERATIONAL' : 'DORMANT'}
                                            </button>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(t.id)}
                                                className="h-10 w-10 rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}

function CreateTemplateForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const { user } = useAuth()
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        target: '',
        type: 'daily' as any,
        priority: 'medium' as any,
        assignedTo: '',
        isActive: true
    })
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setSaving(true)
        try {
            await createKRATemplate({
                ...formData,
                assignedTo: formData.assignedTo.split(',').map(s => s.trim()).filter(Boolean),
                createdBy: user.uid
            })
            toast.success('Template created!')
            onSuccess()
        } catch (error) {
            toast.error('Failed to create template')
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <Label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Protocol Title</Label>
                    <Input
                        type="text"
                        placeholder="ENTER OBJECTIVE TITLE"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="h-14 px-6 bg-gray-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest placeholder:text-gray-200 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Generation Frequency</Label>
                    <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full h-14 px-6 bg-gray-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-100 transition-all outline-none appearance-none cursor-pointer"
                    >
                        <option value="daily">CYCLE: DAILY</option>
                        <option value="weekly">CYCLE: WEEKLY</option>
                        <option value="monthly">CYCLE: MONTHLY</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Objective Parameters</Label>
                <Textarea
                    placeholder="DESCRIBE THE CORE OBJECTIVE OF THIS AUTOMATION PROTOCOL"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-gray-50 border-none rounded-2xl p-6 text-[10px] font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all outline-none placeholder:text-gray-200"
                    rows={4}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <Label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Strategic Importance</Label>
                    <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full h-14 px-6 bg-gray-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-100 transition-all outline-none appearance-none cursor-pointer"
                    >
                        <option value="low">PRIORITY: LOW</option>
                        <option value="medium">PRIORITY: MEDIUM</option>
                        <option value="high">PRIORITY: HIGH</option>
                        <option value="critical">PRIORITY: CRITICAL</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Assignment Matrix (UID CODES)</Label>
                    <Input
                        type="text"
                        placeholder="ENTER USER IDS (COMMA SEPARATED)"
                        value={formData.assignedTo}
                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                        className="h-14 px-6 bg-gray-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest placeholder:text-gray-200 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    />
                </div>
            </div>

            <div className="flex gap-4 pt-6">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest border-gray-100 text-gray-400 hover:bg-white"
                >
                    DISCARD
                </Button>
                <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100"
                >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'DEPLOY PROTOCOL'}
                </Button>
            </div>
        </form>
    )
}

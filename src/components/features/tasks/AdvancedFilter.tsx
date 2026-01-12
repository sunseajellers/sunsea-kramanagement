// Simple advanced filter component
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Filter, Save, X, ChevronDown, ChevronUp } from 'lucide-react'
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import toast from 'react-hot-toast'

export interface FilterPreset {
    id: string
    name: string
    userId: string
    filters: FilterValues
    createdAt: Date
}

export interface FilterValues {
    status?: string[]
    priority?: string[]
    assignedTo?: string[]
    teamId?: string
    dueDateFrom?: string
    dueDateTo?: string
    searchQuery?: string
}

interface AdvancedFilterProps {
    onFilterChange: (filters: FilterValues) => void
    currentFilters: FilterValues
}

const STATUS_OPTIONS = [
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'revision_requested', label: 'Revision Requested' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'completed', label: 'Completed' }
]

const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
]

export default function AdvancedFilter({ onFilterChange, currentFilters }: AdvancedFilterProps) {
    const { user } = useAuth()
    const [expanded, setExpanded] = useState(false)
    const [filters, setFilters] = useState<FilterValues>(currentFilters)
    const [presets, setPresets] = useState<FilterPreset[]>([])
    const [showSaveModal, setShowSaveModal] = useState(false)
    const [presetName, setPresetName] = useState('')

    useEffect(() => {
        if (user) loadPresets()
    }, [user])

    useEffect(() => {
        setFilters(currentFilters)
    }, [currentFilters])

    const loadPresets = async () => {
        if (!user) return
        try {
            const q = query(collection(db, 'filterPresets'), where('userId', '==', user.uid))
            const snapshot = await getDocs(q)
            setPresets(snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as FilterPreset))
        } catch (error) {
            console.error('Failed to load presets:', error)
        }
    }

    const handleFilterChange = (key: keyof FilterValues, value: any) => {
        const newFilters = { ...filters, [key]: value }
        setFilters(newFilters)
    }

    const applyFilters = () => {
        onFilterChange(filters)
    }

    const clearFilters = () => {
        const empty: FilterValues = {}
        setFilters(empty)
        onFilterChange(empty)
    }

    const savePreset = async () => {
        if (!user || !presetName.trim()) return
        try {
            await addDoc(collection(db, 'filterPresets'), {
                name: presetName,
                userId: user.uid,
                filters,
                createdAt: new Date()
            })
            toast.success('Preset saved!')
            setShowSaveModal(false)
            setPresetName('')
            loadPresets()
        } catch (error) {
            toast.error('Failed to save preset')
        }
    }

    const loadPreset = (preset: FilterPreset) => {
        setFilters(preset.filters)
        onFilterChange(preset.filters)
        toast.success(`Loaded: ${preset.name}`)
    }

    const deletePreset = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'filterPresets', id))
            toast.success('Preset deleted')
            loadPresets()
        } catch (error) {
            toast.error('Failed to delete')
        }
    }

    const toggleArrayFilter = (key: keyof FilterValues, value: string) => {
        const current = (filters[key] as string[]) || []
        const newValue = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value]
        handleFilterChange(key, newValue.length > 0 ? newValue : undefined)
    }

    const activeFilterCount = Object.values(filters).filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length

    return (
        <div className="bg-white border rounded-lg">
            {/* Header */}
            <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center">
                    <Filter className="w-4 h-4 mr-2 text-gray-600" />
                    <span className="font-medium">Advanced Filters</span>
                    {activeFilterCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>

            {/* Expanded Content */}
            {expanded && (
                <div className="p-4 border-t space-y-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Search</label>
                        <input
                            type="text"
                            value={filters.searchQuery || ''}
                            onChange={(e) => handleFilterChange('searchQuery', e.target.value || undefined)}
                            placeholder="Search tasks..."
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Status</label>
                        <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => toggleArrayFilter('status', opt.value)}
                                    className={`px-2 py-1 text-xs rounded ${(filters.status || []).includes(opt.value)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Priority</label>
                        <div className="flex flex-wrap gap-2">
                            {PRIORITY_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => toggleArrayFilter('priority', opt.value)}
                                    className={`px-2 py-1 text-xs rounded ${(filters.priority || []).includes(opt.value)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Due From</label>
                            <input
                                type="date"
                                value={filters.dueDateFrom || ''}
                                onChange={(e) => handleFilterChange('dueDateFrom', e.target.value || undefined)}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Due To</label>
                            <input
                                type="date"
                                value={filters.dueDateTo || ''}
                                onChange={(e) => handleFilterChange('dueDateTo', e.target.value || undefined)}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                    </div>

                    {/* Presets */}
                    {presets.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Saved Presets</label>
                            <div className="flex flex-wrap gap-2">
                                {presets.map(preset => (
                                    <div key={preset.id} className="flex items-center">
                                        <button
                                            onClick={() => loadPreset(preset)}
                                            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-l hover:bg-purple-200"
                                        >
                                            {preset.name}
                                        </button>
                                        <button
                                            onClick={() => deletePreset(preset.id)}
                                            className="px-1 py-1 text-xs bg-purple-100 text-purple-700 rounded-r hover:bg-red-100 hover:text-red-700"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 justify-between pt-2 border-t">
                        <div className="flex gap-2">
                            <button
                                onClick={clearFilters}
                                className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
                            >
                                Clear All
                            </button>
                            <button
                                onClick={() => setShowSaveModal(true)}
                                className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 flex items-center"
                            >
                                <Save className="w-3 h-3 mr-1" />
                                Save
                            </button>
                        </div>
                        <button
                            onClick={applyFilters}
                            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Save Preset Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg w-80">
                        <h3 className="font-medium mb-3">Save Filter Preset</h3>
                        <input
                            type="text"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            placeholder="Preset name"
                            className="w-full px-3 py-2 border rounded mb-3"
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowSaveModal(false)} className="px-3 py-1 border rounded">Cancel</button>
                            <button onClick={savePreset} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

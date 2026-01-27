// Simple modal for resolving task revision
'use client'

import { useState } from 'react'
import { X, ClipboardList, Info } from 'lucide-react'
import { resolveTaskRevision } from '@/lib/revisionService'
import toast from 'react-hot-toast'

interface RevisionResolveModalProps {
    revisionId: string
    taskTitle: string
    revisionReason: string
    resolvedBy: string
    resolvedByName: string
    onClose: () => void
    onSuccess: () => void
}

export default function RevisionResolveModal({
    revisionId,
    taskTitle,
    revisionReason,
    resolvedBy,
    resolvedByName,
    onClose,
    onSuccess
}: RevisionResolveModalProps) {
    const [notes, setNotes] = useState('')
    const [proofOfWork, setProofOfWork] = useState('')
    const [proofLink, setProofLink] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!proofOfWork.trim()) {
            toast.error('Please provide a description of the work done')
            return
        }

        setLoading(true)
        try {
            await resolveTaskRevision(revisionId, resolvedBy, resolvedByName, notes, proofOfWork, proofLink)
            toast.success('Revision marked as resolved')
            onSuccess()
            onClose()
        } catch (error) {
            console.error('Failed to resolve revision:', error)
            toast.error('Failed to resolve revision')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 px-8 py-10 text-white shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Complete Revision</h2>
                            <p className="text-indigo-100/70 text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                <Info className="w-3 h-3" />
                                Submitting for final review
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto premium-scrollbar">
                    {/* Task Context */}
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Target Task</p>
                        <p className="text-base font-black text-slate-900 leading-tight">{taskTitle}</p>
                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Manager Feedback</p>
                            <p className="text-sm text-slate-600 font-medium mt-1 italic">"{revisionReason}"</p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4 p-8 bg-indigo-50/30 rounded-[2rem] border border-indigo-100/50">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase text-indigo-900 ml-1 tracking-widest">Description of Results *</label>
                                <textarea
                                    className="premium-input bg-white h-24 py-4 text-xs font-medium"
                                    placeholder="What specific changes were made? Describe the final outcome..."
                                    value={proofOfWork}
                                    onChange={(e) => setProofOfWork(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase text-indigo-900 ml-1 tracking-widest">Proof Link (Optional)</label>
                                <div className="relative group">
                                    <ClipboardList className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    <input
                                        type="url"
                                        className="premium-input bg-white pl-11 text-xs font-medium"
                                        placeholder="https://drive.google.com/..."
                                        value={proofLink}
                                        onChange={(e) => setProofLink(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 px-1">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Notes to Manager</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any additional comments..."
                                className="premium-input bg-slate-50 h-20 py-4 text-xs font-medium"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 h-16 rounded-3xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-[2] h-16 bg-slate-900 hover:bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-100 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Submit Resolution'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

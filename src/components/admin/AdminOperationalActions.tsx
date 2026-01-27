'use client'

import { useState } from 'react'
import { ShieldAlert, Zap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminOperationalActions() {
    const [auditing, setAuditing] = useState(false)

    const handleRunAudit = async () => {
        setAuditing(true)
        try {
            const res = await fetch('/api/admin/tasks/audit', { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
                toast.success(data.message)
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            toast.error('Audit failed')
        } finally {
            setAuditing(false)
        }
    }

    const [pulsing, setPulsing] = useState(false)

    const handleRunPulse = async () => {
        setPulsing(true)
        try {
            const res = await fetch('/api/admin/kpi/pulse', { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
                toast.success(data.message)
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            toast.error('KPI Pulse failed')
        } finally {
            setPulsing(false)
        }
    }

    return (
        <div className="flex flex-wrap gap-4 items-center">
            <button
                onClick={handleRunAudit}
                disabled={auditing}
                className="h-14 px-8 rounded-2xl border-2 border-slate-100 bg-white text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all font-black text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
                {auditing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <ShieldAlert className="w-5 h-5" />
                )}
                Analyze Constraints
            </button>

            <button
                onClick={handleRunPulse}
                disabled={pulsing}
                className="btn-primary h-14 px-8 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
                {pulsing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Zap className="w-5 h-5" />
                )}
                Pulse Logic Engine
            </button>
        </div>
    )
}

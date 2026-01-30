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
                title="Checks for overdue items and alerts team members"
                className="btn-secondary h-14"
            >
                {auditing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <ShieldAlert className="w-5 h-5" />
                )}
                System Health Check
            </button>

            <button
                onClick={handleRunPulse}
                disabled={pulsing}
                title="Updates performance scores based on recent work"
                className="btn-primary h-14"
            >
                {pulsing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Zap className="w-5 h-5" />
                )}
                Refresh All Scores
            </button>
        </div>
    )
}

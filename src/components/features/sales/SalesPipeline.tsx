'use client'

import { useState, useEffect } from 'react'
import { Sale } from '@/types'
import { getAllSales, PIPELINE_STAGES } from '@/lib/salesService'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, DollarSign, Plus, MoreVertical, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function SalesPipeline() {
    const [sales, setSales] = useState<Sale[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadSales()
    }, [])

    const loadSales = async () => {
        try {
            setLoading(true)
            const data = await getAllSales()
            setSales(data)
        } catch (error) {
            toast.error('Failed to load sales pipeline')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Loading Pipeline...</p>
            </div>
        )
    }

    return (
        <div className="flex gap-6 overflow-x-auto pb-6 scroll-panel min-h-[600px]">
            {PIPELINE_STAGES.map((stage) => {
                const stageSales = sales.filter(s => s.stage === stage.id)
                const totalAmount = stageSales.reduce((sum, s) => sum + s.amount, 0)

                return (
                    <div key={stage.id} className="flex-shrink-0 w-80 space-y-4">
                        {/* Column Header */}
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border",
                                    stage.color
                                )}>
                                    {stage.label}
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground bg-muted w-6 h-6 flex items-center justify-center rounded-full">
                                    {stageSales.length}
                                </span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Column Summary */}
                        <div className="px-2 pb-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Total: <span className="text-primary">${totalAmount.toLocaleString()}</span>
                            </p>
                        </div>

                        {/* Cards List */}
                        <div className="space-y-4 min-h-[500px] bg-slate-50/50 rounded-2xl p-2 border border-dashed border-slate-200">
                            {stageSales.map((sale) => (
                                <Card key={sale.id} className="p-4 bg-white shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing border-slate-100 group">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-black text-xs uppercase tracking-tight text-slate-900 line-clamp-1">
                                            {sale.customerName}
                                        </h4>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm font-bold text-primary flex items-center gap-1">
                                            <DollarSign className="w-3 h-3" />
                                            {sale.amount.toLocaleString()}
                                        </p>

                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${sale.probability}%` }}
                                                />
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400">{sale.probability}%</span>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                            <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase">
                                                <Calendar className="w-3 h-3 opacity-40" />
                                                {sale.expectedClosedDate
                                                    ? new Date(sale.expectedClosedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                                    : 'No date'
                                                }
                                            </div>
                                            <div className="w-6 h-6 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[9px] font-black uppercase text-slate-400">
                                                {sale.createdBy?.substring(0, 2)}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

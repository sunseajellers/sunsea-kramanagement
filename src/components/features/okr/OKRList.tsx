import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Objective } from '@/types'
import { Target } from 'lucide-react'

// Extended type to include embedded Key Results removed as Objective now includes it
interface OKRListProps {
    okrs?: Objective[]
}

export default function OKRList({ okrs = [] }: OKRListProps) {
    if (!okrs || okrs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 rounded-[2rem] bg-white/40 border border-white/60 border-dashed text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Target className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">No active goals found</h3>
                <p className="text-slate-500 text-sm max-w-xs">
                    You haven't been assigned any Objectives yet.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-end">
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">Q1 2026</Badge>
            </div>

            <div className="space-y-4">
                {okrs.map((okr) => (
                    <div key={okr.id} className="glass-card p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-slate-900">{okr.title}</h3>
                                <p className="text-sm text-slate-500">{okr.description}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-indigo-600">{okr.progress}%</span>
                            </div>
                        </div>

                        <Progress value={okr.progress} className="h-2 bg-slate-100" indicatorClassName="bg-indigo-600" />

                        <div className="pt-2 space-y-2">
                            {okr.keyResults && okr.keyResults.length > 0 ? (
                                okr.keyResults.map(kr => (
                                    <div key={kr.id} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <span className="font-medium text-slate-700">{kr.title}</span>
                                        <span className="font-bold text-slate-400">
                                            {kr.currentValue}{kr.unit} / {kr.targetValue}{kr.unit}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic p-2">No key results linked.</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

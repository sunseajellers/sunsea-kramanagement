import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface KeyResult {
    id: string
    title: string
    currentValue: number
    targetValue: number
    unit: string
    progress: number
}

interface Objective {
    id: string
    title: string
    description: string
    ownerName: string
    teamName: string
    timeframe: string
    status: 'draft' | 'active' | 'completed'
    progress: number
    keyResults: KeyResult[]
}

const MOCK_OKRS: Objective[] = [
    {
        id: 'o1',
        title: 'Dominate the Q1 Online Sales Market',
        description: 'Increase overall digital presence and conversion rate across all e-commerce channels.',
        ownerName: 'Bruno Marshall',
        teamName: 'E-commerce',
        timeframe: 'Q1 2026',
        status: 'active',
        progress: 68,
        keyResults: [
            { id: 'kr1', title: 'Increase web conversion rate to 4.5%', currentValue: 3.2, targetValue: 4.5, unit: '%', progress: 71 },
            { id: 'kr2', title: 'Generate $250k in new online sales', currentValue: 185000, targetValue: 250000, unit: '$', progress: 74 },
            { id: 'kr3', title: 'Reduce cart abandonment to under 20%', currentValue: 28, targetValue: 20, unit: '%', progress: 60 }
        ]
    },
    {
        id: 'o2',
        title: 'Optimize Operational Efficiency',
        description: 'Streamline internal processes to reduce task turnaround time and improve NPS.',
        ownerName: 'Sarah Jenkins',
        teamName: 'Operations',
        timeframe: 'Q1 2026',
        status: 'active',
        progress: 45,
        keyResults: [
            { id: 'kr4', title: 'Achieve 95% on-time delivery rate', currentValue: 88, targetValue: 95, unit: '%', progress: 45 },
            { id: 'kr5', title: 'Implement automated reporting for all depts', currentValue: 3, targetValue: 8, unit: 'Depts', progress: 37 }
        ]
    }
]

// Simple Goals List
export default function OKRList() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Active Goals</h2>
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">Q1 2026</Badge>
            </div>

            <div className="space-y-4">
                {MOCK_OKRS.map((okr) => (
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
                            {okr.keyResults.map(kr => (
                                <div key={kr.id} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                    <span className="font-medium text-slate-700">{kr.title}</span>
                                    <span className="font-bold text-slate-400">
                                        {kr.currentValue}{kr.unit} / {kr.targetValue}{kr.unit}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

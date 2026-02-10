'use client';

import { Objective, KeyResult } from '@/types';
import {
    Target, ChevronRight,
    MoreHorizontal, ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface Props {
    objectives: Objective[];
    onKeyResultClick: (kr: KeyResult) => void;
}

export default function OKRTree({ objectives, onKeyResultClick }: Props) {
    const [expandedIds, setExpandedIds] = useState<string[]>([]);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-4">
            {objectives.map(objective => (
                <div key={objective.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                    {/* Objective Header */}
                    <div
                        className="p-4 flex items-center justify-between cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
                        onClick={() => toggleExpand(objective.id)}
                    >
                        <div className="flex items-center gap-4">
                            <button className={cn("p-1.5 rounded-md hover:bg-slate-200 transition-colors", expandedIds.includes(objective.id) && "rotate-90")}>
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                            </button>
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                <Target className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-base">{objective.title}</h3>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                    <span className="font-medium text-slate-700">{objective.ownerName}</span>
                                    <span>•</span>
                                    <span className="uppercase tracking-wide">{objective.timeframe}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="w-32">
                                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                                    <span>Progress</span>
                                    <span>{objective.progress}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full transition-all duration-500",
                                            objective.progress >= 70 ? "bg-emerald-500" :
                                                objective.progress >= 40 ? "bg-amber-500" :
                                                    "bg-rose-500"
                                        )}
                                        style={{ width: `${objective.progress}%` }}
                                    />
                                </div>
                            </div>
                            <button className="text-slate-300 hover:text-slate-600 p-2">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Key Results (Children) */}
                    {expandedIds.includes(objective.id) && (
                        <div className="border-t border-slate-100 divide-y divide-slate-50 bg-white">
                            {objective.keyResults && objective.keyResults.length > 0 ? (
                                objective.keyResults.map(kr => (
                                    <div
                                        key={kr.id}
                                        className="p-4 pl-20 flex items-center justify-between hover:bg-slate-50 group cursor-pointer"
                                        onClick={() => onKeyResultClick(kr)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-primary transition-colors" />
                                            <div>
                                                <h4 className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{kr.title}</h4>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">
                                                    <span>Target: {kr.targetValue}</span>
                                                    <span>•</span>
                                                    <span>Current: {kr.currentValue}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <span className={cn("text-xs font-bold",
                                                    kr.progress >= 70 ? "text-emerald-600" :
                                                        kr.progress >= 40 ? "text-amber-600" :
                                                            "text-rose-600"
                                                )}>
                                                    {Math.round(kr.progress)}%
                                                </span>
                                            </div>
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-300 group-hover:text-primary">
                                                <ArrowUpRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-sm text-slate-400 italic">
                                    No key results defined for this objective yet.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

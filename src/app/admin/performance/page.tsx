'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, FileText, Award, Archive } from "lucide-react"
import AnalyticsHub from "@/components/features/performance/AnalyticsHub"
import WeeklyReports from "@/components/features/performance/WeeklyReports"
import ScoringConfig from "@/components/features/performance/ScoringConfig"
import KPIArchives from "@/components/features/performance/KPIArchives"

export default function PerformanceHubPage() {
    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="section-title">Operational Results</h1>
                    <p className="section-subtitle">System-wide performance analytics, human capital audits, and scoring</p>
                </div>
            </div>

            <Tabs defaultValue="analytics" className="w-full">
                <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/60 mb-8 overflow-x-auto scrollbar-none w-fit">
                    <TabsList className="bg-transparent border-none p-0 h-auto flex gap-1">
                        <TabsTrigger
                            value="analytics"
                            className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm data-[state=active]:border-slate-200/60 border border-transparent transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 whitespace-nowrap"
                        >
                            <BarChart3 className="w-4 h-4" />
                            Intelligence
                        </TabsTrigger>
                        <TabsTrigger
                            value="reports"
                            className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm data-[state=active]:border-slate-200/60 border border-transparent transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 whitespace-nowrap"
                        >
                            <FileText className="w-4 h-4" />
                            Active Reports
                        </TabsTrigger>
                        <TabsTrigger
                            value="archives"
                            className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm data-[state=active]:border-slate-200/60 border border-transparent transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 whitespace-nowrap"
                        >
                            <Archive className="w-4 h-4" />
                            Historical Log
                        </TabsTrigger>
                        <TabsTrigger
                            value="scoring"
                            className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm data-[state=active]:border-slate-200/60 border border-transparent transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 whitespace-nowrap"
                        >
                            <Award className="w-4 h-4" />
                            Scoring Configuration
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="analytics" className="mt-0 border-none p-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <AnalyticsHub />
                </TabsContent>

                <TabsContent value="reports" className="mt-0 border-none p-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <WeeklyReports />
                </TabsContent>

                <TabsContent value="archives" className="mt-0 border-none p-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <KPIArchives />
                </TabsContent>

                <TabsContent value="scoring" className="mt-0 border-none p-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <ScoringConfig />
                </TabsContent>
            </Tabs>
        </div>
    );
}

'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, FileText, Award, Archive } from "lucide-react"
import AnalyticsHub from "@/components/features/performance/AnalyticsHub"
import WeeklyReports from "@/components/features/performance/WeeklyReports"
import ScoringConfig from "@/components/features/performance/ScoringConfig"
import KPIArchives from "@/components/features/performance/KPIArchives"

export default function PerformanceHubPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Performance Hub</h1>
                <p className="text-sm text-gray-400 font-medium">Strategic intelligence and historical performance data</p>
            </div>

            <Tabs defaultValue="analytics" className="space-y-6">
                <TabsList className="bg-white border border-gray-100 p-1 rounded-xl h-auto flex flex-wrap gap-1 shadow-sm">
                    <TabsTrigger
                        value="analytics"
                        className="rounded-lg px-4 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none flex items-center gap-2"
                    >
                        <BarChart3 className="w-4 h-4" />
                        Intelligence
                    </TabsTrigger>
                    <TabsTrigger
                        value="reports"
                        className="rounded-lg px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none flex items-center gap-2"
                    >
                        <FileText className="w-4 h-4" />
                        Weekly Reports
                    </TabsTrigger>
                    <TabsTrigger
                        value="scoring"
                        className="rounded-lg px-4 py-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none flex items-center gap-2"
                    >
                        <Award className="w-4 h-4" />
                        Scoring
                    </TabsTrigger>
                    <TabsTrigger
                        value="archives"
                        className="rounded-lg px-4 py-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-none flex items-center gap-2"
                    >
                        <Archive className="w-4 h-4" />
                        Archives
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="analytics" className="mt-0 border-none p-0 outline-none">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <AnalyticsHub />
                    </div>
                </TabsContent>

                <TabsContent value="reports" className="mt-0 border-none p-0 outline-none">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <WeeklyReports />
                    </div>
                </TabsContent>

                <TabsContent value="scoring" className="mt-0 border-none p-0 outline-none">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <ScoringConfig />
                    </div>
                </TabsContent>

                <TabsContent value="archives" className="mt-0 border-none p-0 outline-none">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <KPIArchives />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

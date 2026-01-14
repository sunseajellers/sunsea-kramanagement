'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, FileText, Award, Archive } from "lucide-react"
import AnalyticsHub from "@/components/features/performance/AnalyticsHub"
import WeeklyReports from "@/components/features/performance/WeeklyReports"
import ScoringConfig from "@/components/features/performance/ScoringConfig"
import KPIArchives from "@/components/features/performance/KPIArchives"
import MISScorecard from "@/components/features/performance/MISScorecard"

export default function PerformanceHubPage() {
    return (
        <div className="page-container">
            <div className="flex items-center gap-4 mb-4 flex-shrink-0">
                <div className="icon-box icon-box-md bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
                    <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Reports & Scores</h1>
                    <p className="text-sm text-gray-400 font-medium">See weekly reports, track performance, and view past records</p>
                </div>
            </div>

            <Tabs defaultValue="analytics" className="flex-1 flex flex-col min-h-0">
                <TabsList className="bg-white border border-gray-100 p-1 rounded-xl h-auto flex flex-wrap gap-1 shadow-sm flex-shrink-0">
                    <TabsTrigger
                        value="analytics"
                        className="rounded-lg px-4 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none flex items-center gap-2"
                    >
                        <BarChart3 className="w-4 h-4" />
                        Intelligence
                    </TabsTrigger>
                    <TabsTrigger
                        value="mis"
                        className="rounded-lg px-4 py-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-none flex items-center gap-2"
                    >
                        <Award className="w-4 h-4" />
                        MIS Scorecard
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

                <TabsContent value="mis" className="flex-1 mt-4 border-none p-0 outline-none overflow-auto">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm h-full overflow-auto">
                        <MISScorecard />
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="flex-1 mt-4 border-none p-0 outline-none overflow-auto">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm h-full overflow-auto">
                        <AnalyticsHub />
                    </div>
                </TabsContent>

                <TabsContent value="reports" className="flex-1 mt-4 border-none p-0 outline-none overflow-auto">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm h-full overflow-auto">
                        <WeeklyReports />
                    </div>
                </TabsContent>

                <TabsContent value="scoring" className="flex-1 mt-4 border-none p-0 outline-none overflow-auto">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm h-full overflow-auto">
                        <ScoringConfig />
                    </div>
                </TabsContent>

                <TabsContent value="archives" className="flex-1 mt-4 border-none p-0 outline-none overflow-auto">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm h-full overflow-auto">
                        <KPIArchives />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

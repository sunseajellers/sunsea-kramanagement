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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Tabs */}
            <Tabs defaultValue="analytics" className="w-full">
                <TabsList className="bg-white border border-gray-100 p-1 rounded-xl h-auto flex flex-wrap gap-1 shadow-sm">
                    <TabsTrigger
                        value="analytics"
                        className="rounded-lg px-3 sm:px-4 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none flex items-center gap-2 text-xs sm:text-sm"
                    >
                        <BarChart3 className="w-4 h-4" />
                        Intelligence
                    </TabsTrigger>
                    <TabsTrigger
                        value="reports"
                        className="rounded-lg px-3 sm:px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none flex items-center gap-2 text-xs sm:text-sm"
                    >
                        <FileText className="w-4 h-4" />
                        Weekly Reports
                    </TabsTrigger>
                    <TabsTrigger
                        value="scoring"
                        className="rounded-lg px-3 sm:px-4 py-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none flex items-center gap-2 text-xs sm:text-sm"
                    >
                        <Award className="w-4 h-4" />
                        Scoring
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="analytics" className="mt-6 border-none p-0 outline-none">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                        <AnalyticsHub />
                    </div>
                </TabsContent>

                <TabsContent value="reports" className="mt-6 border-none p-0 outline-none">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                        <WeeklyReports />
                    </div>
                </TabsContent>

                <TabsContent value="scoring" className="mt-6 border-none p-0 outline-none">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                        <ScoringConfig />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

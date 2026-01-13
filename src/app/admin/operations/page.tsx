'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Zap } from "lucide-react"
import MasterTaskList from "@/components/features/tasks/MasterTaskList"
import KRAScheduler from "@/components/features/kra/KRAScheduler"

export default function OperationsHubPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Operations Hub</h1>
                <p className="text-sm text-gray-400 font-medium">Global task management and automated objective delivery</p>
            </div>

            <Tabs defaultValue="tasks" className="space-y-6">
                <TabsList className="bg-white border border-gray-100 p-1 rounded-xl h-auto flex flex-wrap gap-1 shadow-sm">
                    <TabsTrigger
                        value="tasks"
                        className="rounded-lg px-4 py-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-none flex items-center gap-2"
                    >
                        <FileText className="w-4 h-4" />
                        Master Tasks
                    </TabsTrigger>
                    <TabsTrigger
                        value="automation"
                        className="rounded-lg px-4 py-2 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-none flex items-center gap-2"
                    >
                        <Zap className="w-4 h-4" />
                        Automation
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="tasks" className="mt-0 border-none p-0 outline-none">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <MasterTaskList />
                    </div>
                </TabsContent>

                <TabsContent value="automation" className="mt-0 border-none p-0 outline-none">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <KRAScheduler />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

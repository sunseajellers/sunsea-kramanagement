'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Zap, Download, Loader2 } from "lucide-react"
import MasterTaskList from "@/components/features/tasks/MasterTaskList"
import KRAScheduler from "@/components/features/kra/KRAScheduler"
import { Button } from "@/components/ui/button"
import { exportToCSV } from "@/lib/exportUtils"
import { getAllTasks } from "@/lib/taskService"
import { getAllKRAs } from "@/lib/kraService"
import { useState } from "react"
import { toast } from "react-hot-toast"

function ExportButtons() {
    const [exportingTasks, setExportingTasks] = useState(false);
    const [exportingKRAs, setExportingKRAs] = useState(false);

    const handleExportTasks = async () => {
        try {
            setExportingTasks(true);
            const tasks = await getAllTasks(1000); // Fetch up to 1000 tasks
            exportToCSV(tasks, `tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
            toast.success('Tasks exported successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to export tasks');
        } finally {
            setExportingTasks(false);
        }
    };

    const handleExportKRAs = async () => {
        try {
            setExportingKRAs(true);
            const kras = await getAllKRAs(1000); // Fetch up to 1000 KRAs
            exportToCSV(kras, `kras_export_${new Date().toISOString().split('T')[0]}.csv`);
            toast.success('KRAs exported successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to export KRAs');
        } finally {
            setExportingKRAs(false);
        }
    };

    return (
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportTasks} disabled={exportingTasks} className="h-8 text-xs">
                {exportingTasks ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Download className="w-3 h-3 mr-2" />}
                Export Tasks
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportKRAs} disabled={exportingKRAs} className="h-8 text-xs">
                {exportingKRAs ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Download className="w-3 h-3 mr-2" />}
                Export KRAs
            </Button>
        </div>
    );
}

export default function OperationsHubPage() {
    return (
        <div className="page-container">
            <div className="flex items-center gap-4 mb-4 flex-shrink-0">
                <div className="icon-box icon-box-md bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-lg shadow-purple-500/20">
                    <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Tasks & Goals</h1>
                    <p className="text-sm text-gray-400 font-medium">Create tasks, assign work to employees, and manage daily operations</p>
                </div>
            </div>

            <div className="flex gap-2 mb-2 justify-end">
                <ExportButtons />
            </div>

            <Tabs defaultValue="tasks" className="flex-1 flex flex-col min-h-0">
                <TabsList className="bg-white border border-gray-100 p-1 rounded-xl h-auto flex flex-wrap gap-1 shadow-sm flex-shrink-0">
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

                <TabsContent value="tasks" className="flex-1 mt-4 border-none p-0 outline-none overflow-auto">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm h-full overflow-auto">
                        <MasterTaskList />
                    </div>
                </TabsContent>

                <TabsContent value="automation" className="flex-1 mt-4 border-none p-0 outline-none overflow-auto">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm h-full overflow-auto">
                        <KRAScheduler />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Loader2 } from "lucide-react"
import MasterTaskList from "@/components/features/tasks/MasterTaskList"
import KRAScheduler from "@/components/features/kra/KRAScheduler"
import TaskVerification from "@/components/features/tasks/TaskVerification"
import PerformanceAnalytics from "@/components/admin/PerformanceAnalytics"
import PerformanceTrends from "@/components/admin/PerformanceTrends"
import ReportGenerator from "@/components/admin/ReportGenerator"
import ExtensionRequestQueue from "@/components/admin/ExtensionRequestQueue"
import AdminOperationalActions from "@/components/admin/AdminOperationalActions"
import { exportToCSV } from "@/lib/exportUtils"
import { getAllTasks } from "@/lib/taskService"
import { getAllKRAs } from "@/lib/kraService"
import { useState } from "react"
import { toast } from "react-hot-toast"

export default function OperationsHubPage() {
    return (
        <div className="space-y-16 animate-in">
            {/* Header / Actions */}
            <div className="page-header flex flex-col xl:flex-row xl:items-end justify-between gap-10">
                <div>
                    <h1 className="section-title">KRA & Operations</h1>
                    <p className="text-base font-semibold text-muted-foreground/70 mt-3">Daily mission control: tasks, verifications, and tactical targets</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <AdminOperationalActions />
                    <ExportButtons />
                </div>
            </div>

            {/* Navigation Tabs */}
            <Tabs defaultValue="tasks" className="w-full">
                <div className="flex items-center justify-between mb-12 overflow-x-auto pb-4 scrollbar-none">
                    <TabsList className="bg-muted/50 p-2 rounded-[1.75rem] border border-border h-auto flex gap-2">
                        {[
                            { value: 'tasks', label: 'All Tasks' },
                            { value: 'verification', label: 'Approvals' },
                            { value: 'requests', label: 'Deadlines' },
                            { value: 'auto-tasks', label: 'Auto-Tasks' },
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="rounded-[1.25rem] px-8 py-3.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xl border border-transparent data-[state=active]:border-border/50 flex items-center gap-3 text-sm font-bold transition-all"
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <div className="mt-8">
                    <TabsContent value="tasks" className="animate-in outline-none">
                        <MasterTaskList />
                    </TabsContent>

                    <TabsContent value="verification" className="animate-in outline-none">
                        <div className="max-w-6xl mx-auto">
                            <TaskVerification />
                        </div>
                    </TabsContent>

                    <TabsContent value="requests" className="animate-in outline-none">
                        <div className="max-w-6xl mx-auto">
                            <ExtensionRequestQueue />
                        </div>
                    </TabsContent>

                    <TabsContent value="auto-tasks" className="animate-in outline-none">
                        <KRAScheduler />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

function ExportButtons() {
    const [exportingTasks, setExportingTasks] = useState(false);
    const [exportingKRAs, setExportingKRAs] = useState(false);

    const handleExportTasks = async () => {
        try {
            setExportingTasks(true);
            const tasks = await getAllTasks(1000);
            exportToCSV(tasks, `task_list_${new Date().toISOString().split('T')[0]}.csv`);
            toast.success('Task list downloaded');
        } catch (error) {
            console.error(error);
            toast.error('Failed to download tasks');
        } finally {
            setExportingTasks(false);
        }
    };

    const handleExportKRAs = async () => {
        try {
            setExportingKRAs(true);
            const kras = await getAllKRAs(1000);
            exportToCSV(kras, `goal_list_${new Date().toISOString().split('T')[0]}.csv`);
            toast.success('Goal list downloaded');
        } catch (error) {
            console.error(error);
            toast.error('Failed to download goals');
        } finally {
            setExportingKRAs(false);
        }
    };

    return (
        <div className="flex items-center gap-4">
            <button
                onClick={handleExportTasks}
                disabled={exportingTasks}
                className="btn-secondary h-14"
            >
                {exportingTasks ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                Download Tasks
            </button>
            <button
                onClick={handleExportKRAs}
                disabled={exportingKRAs}
                className="btn-secondary h-14"
            >
                {exportingKRAs ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                Download Goals
            </button>
        </div>
    );
}

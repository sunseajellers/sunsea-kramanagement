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
import { Button } from "@/components/ui/button"
import { exportToCSV } from "@/lib/exportUtils"
import { getAllTasks } from "@/lib/taskService"
import { getAllKRAs } from "@/lib/kraService"
import { useState } from "react"
import { toast } from "react-hot-toast"

export default function OperationsHubPage() {
    return (
        <div className="space-y-10">
            {/* Header / Actions */}
            <div className="page-header flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                <div>
                    <h1 className="section-title">Operations Command</h1>
                    <p className="section-subtitle">Real-time task velocity and performance logistics</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <AdminOperationalActions />
                    <ExportButtons />
                </div>
            </div>

            {/* Navigation Tabs */}
            <Tabs defaultValue="tasks" className="w-full">
                <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4 scrollbar-none">
                    <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/60 h-auto flex gap-1">
                        {[
                            { value: 'tasks', label: 'Task Matrix' },
                            { value: 'verification', label: 'Verification' },
                            { value: 'requests', label: 'Extensions' },
                            { value: 'kpis', label: 'OKR Planning' },
                            { value: 'scores', label: 'Analytics' },
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="rounded-xl px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200/60 flex items-center gap-2.5 text-sm font-bold transition-all"
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContent value="tasks" className="animate-in outline-none">
                    <MasterTaskList />
                </TabsContent>

                <TabsContent value="verification" className="animate-in outline-none">
                    <div className="max-w-5xl mx-auto">
                        <TaskVerification />
                    </div>
                </TabsContent>

                <TabsContent value="requests" className="animate-in outline-none">
                    <div className="max-w-5xl mx-auto">
                        <ExtensionRequestQueue />
                    </div>
                </TabsContent>

                <TabsContent value="kpis" className="animate-in outline-none">
                    <KRAScheduler />
                </TabsContent>

                <TabsContent value="scores" className="animate-in outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-10">
                            <PerformanceAnalytics />
                            <PerformanceTrends />
                        </div>
                        <div className="space-y-10">
                            <ReportGenerator />
                        </div>
                    </div>
                </TabsContent>
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
            const kras = await getAllKRAs(1000);
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
        <div className="flex items-center gap-3">
            <Button onClick={handleExportTasks} disabled={exportingTasks} className="btn-secondary h-11 px-6">
                {exportingTasks ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Tasks
            </Button>
            <Button onClick={handleExportKRAs} disabled={exportingKRAs} className="btn-secondary h-11 px-6">
                {exportingKRAs ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                KRAs
            </Button>
        </div>
    );
}

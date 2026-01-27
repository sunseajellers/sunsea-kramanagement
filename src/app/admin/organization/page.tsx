'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Users2, Building2, Download, Loader2 } from "lucide-react"
import UserManagement from "@/components/features/users/UserManagement"
import TeamManagement from "@/components/features/teams/TeamManagement"
import DepartmentManagement from "@/components/features/users/DepartmentManagement"
import { Button } from "@/components/ui/button"
import { exportToCSV } from "@/lib/exportUtils"
import { getAllUsers } from "@/lib/userService"
import { getAllTeams } from "@/lib/teamService"
import { useState } from "react"
import { toast } from "react-hot-toast"

export default function OrganizationHubPage() {
    return (
        <div className="space-y-10">
            {/* Page Header */}
            <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="section-title">Organization Hub</h1>
                    <p className="section-subtitle">Manage personnel, structure, and operational teams</p>
                </div>
                <ExportButtons />
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="members" className="w-full">
                <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4 scrollbar-none">
                    <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/60 h-auto flex gap-1">
                        {[
                            { value: 'members', label: 'Members', icon: Users },
                            { value: 'departments', label: 'Departments', icon: Building2 },
                            { value: 'teams', label: 'Teams', icon: Users2 },
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="rounded-xl px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200/60 flex items-center gap-2.5 text-sm font-bold transition-all"
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContent value="members" className="animate-in outline-none">
                    <UserManagement />
                </TabsContent>

                <TabsContent value="departments" className="animate-in outline-none text-slate-800">
                    <DepartmentManagement />
                </TabsContent>

                <TabsContent value="teams" className="animate-in outline-none">
                    <TeamManagement />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function ExportButtons() {
    const [exportingUsers, setExportingUsers] = useState(false);
    const [exportingTeams, setExportingTeams] = useState(false);

    const handleExportUsers = async () => {
        try {
            setExportingUsers(true);
            const users = await getAllUsers();
            exportToCSV(users, `users_export_${new Date().toISOString().split('T')[0]}.csv`);
            toast.success('Users exported successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to export users');
        } finally {
            setExportingUsers(false);
        }
    };

    const handleExportTeams = async () => {
        try {
            setExportingTeams(true);
            const teams = await getAllTeams();
            exportToCSV(teams, `teams_export_${new Date().toISOString().split('T')[0]}.csv`);
            toast.success('Teams exported successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to export teams');
        } finally {
            setExportingTeams(false);
        }
    };

    return (
        <div className="flex items-center gap-3">
            <Button onClick={handleExportUsers} disabled={exportingUsers} className="btn-secondary h-11 px-6">
                {exportingUsers ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Export Users
            </Button>
            <Button onClick={handleExportTeams} disabled={exportingTeams} className="btn-secondary h-11 px-6">
                {exportingTeams ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Export Teams
            </Button>
        </div>
    );
}

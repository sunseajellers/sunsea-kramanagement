'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Users2, Building2, Download, Loader2 } from "lucide-react"
import UserManagement from "@/components/features/users/UserManagement"
import TeamManagement from "@/components/features/teams/TeamManagement"
import DepartmentManagement from "@/components/features/users/DepartmentManagement"
import { exportToCSV } from "@/lib/exportUtils"
import { getAllUsers } from "@/lib/userService"
import { getAllTeams } from "@/lib/teamService"
import { useState } from "react"
import { toast } from "react-hot-toast"

export default function OrganizationHubPage() {
    return (
        <div className="space-y-16 animate-in">
            {/* Page Header */}
            <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div>
                    <h1 className="section-title">Team Hub</h1>
                    <p className="text-base font-semibold text-muted-foreground/70 mt-3">Manage everyone, your groups, and staff teams</p>
                </div>
                <ExportButtons />
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="members" className="w-full">
                <div className="flex items-center justify-between mb-12 overflow-x-auto pb-4 scrollbar-none">
                    <TabsList className="bg-muted/50 p-2 rounded-[1.75rem] border border-border h-auto flex gap-2">
                        {[
                            { value: 'members', label: 'People', icon: Users },
                            { value: 'departments', label: 'Groups', icon: Building2 },
                            { value: 'teams', label: 'Teams', icon: Users2 },
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="rounded-[1.25rem] px-8 py-3.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xl border border-transparent data-[state=active]:border-border/50 flex items-center gap-3 text-sm font-bold transition-all"
                            >
                                <tab.icon className="w-5 h-5 transition-transform data-[state=active]:scale-110" />
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <div className="mt-8">
                    <TabsContent value="members" className="animate-in outline-none">
                        <UserManagement />
                    </TabsContent>

                    <TabsContent value="departments" className="animate-in outline-none">
                        <DepartmentManagement />
                    </TabsContent>

                    <TabsContent value="teams" className="animate-in outline-none">
                        <TeamManagement />
                    </TabsContent>
                </div>
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
            exportToCSV(users, `staff_list_${new Date().toISOString().split('T')[0]}.csv`);
            toast.success('Staff list downloaded');
        } catch (error) {
            console.error(error);
            toast.error('Failed to download staff list');
        } finally {
            setExportingUsers(false);
        }
    };

    const handleExportTeams = async () => {
        try {
            setExportingTeams(true);
            const teams = await getAllTeams();
            exportToCSV(teams, `team_list_${new Date().toISOString().split('T')[0]}.csv`);
            toast.success('Team list downloaded');
        } catch (error) {
            console.error(error);
            toast.error('Failed to download team list');
        } finally {
            setExportingTeams(false);
        }
    };

    return (
        <div className="flex items-center gap-4">
            <button
                onClick={handleExportUsers}
                disabled={exportingUsers}
                className="btn-secondary h-14"
            >
                {exportingUsers ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                Download People List
            </button>
            <button
                onClick={handleExportTeams}
                disabled={exportingTeams}
                className="btn-secondary h-14"
            >
                {exportingTeams ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                Download Team List
            </button>
        </div>
    );
}

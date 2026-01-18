'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Users2, Download, Loader2 } from "lucide-react"
import UserManagement from "@/components/features/users/UserManagement"
import TeamManagement from "@/components/features/teams/TeamManagement"
import { Button } from "@/components/ui/button"
import { exportToCSV } from "@/lib/exportUtils"
import { getAllUsers } from "@/lib/userService"
import { getAllTeams } from "@/lib/teamService"
import { useState } from "react"
import { toast } from "react-hot-toast"

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
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportUsers} disabled={exportingUsers} className="h-8 text-xs">
                {exportingUsers ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Download className="w-3 h-3 mr-2" />}
                Export Users
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportTeams} disabled={exportingTeams} className="h-8 text-xs">
                {exportingTeams ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Download className="w-3 h-3 mr-2" />}
                Export Teams
            </Button>
        </div>
    );
}

export default function OrganizationHubPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Export buttons */}
            <div className="flex gap-2 mb-6 justify-end">
                <ExportButtons />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="members" className="w-full">
                <TabsList className="bg-white border border-gray-100 p-1 rounded-xl h-auto flex flex-wrap gap-1 shadow-sm">
                    <TabsTrigger
                        value="members"
                        className="rounded-lg px-3 sm:px-4 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none flex items-center gap-2 text-xs sm:text-sm"
                    >
                        <Users className="w-4 h-4" />
                        Members
                    </TabsTrigger>
                    <TabsTrigger
                        value="teams"
                        className="rounded-lg px-3 sm:px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none flex items-center gap-2 text-xs sm:text-sm"
                    >
                        <Users2 className="w-4 h-4" />
                        Teams
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="mt-6 border-none p-0 outline-none">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                        <UserManagement />
                    </div>
                </TabsContent>

                <TabsContent value="teams" className="mt-6 border-none p-0 outline-none">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                        <TeamManagement />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

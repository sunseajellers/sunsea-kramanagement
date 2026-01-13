'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Users, Users2 } from "lucide-react"
import TeamHub from "@/components/features/teams/TeamHub"
import UserManagement from "@/components/features/users/UserManagement"
import TeamManagement from "@/components/features/teams/TeamManagement"

export default function OrganizationHubPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Organization Hub</h1>
                <p className="text-sm text-gray-400 font-medium">Manage your workforce, teams, and real-time performance</p>
            </div>

            <Tabs defaultValue="monitoring" className="space-y-6">
                <TabsList className="bg-white border border-gray-100 p-1 rounded-xl h-auto flex flex-wrap gap-1 shadow-sm">
                    <TabsTrigger
                        value="monitoring"
                        className="rounded-lg px-4 py-2 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-none flex items-center gap-2"
                    >
                        <Shield className="w-4 h-4" />
                        Monitoring
                    </TabsTrigger>
                    <TabsTrigger
                        value="members"
                        className="rounded-lg px-4 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none flex items-center gap-2"
                    >
                        <Users className="w-4 h-4" />
                        Members
                    </TabsTrigger>
                    <TabsTrigger
                        value="teams"
                        className="rounded-lg px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none flex items-center gap-2"
                    >
                        <Users2 className="w-4 h-4" />
                        Teams
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="monitoring" className="mt-0 border-none p-0 outline-none">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <TeamHub />
                    </div>
                </TabsContent>

                <TabsContent value="members" className="mt-0 border-none p-0 outline-none">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-left">
                        <UserManagement />
                    </div>
                </TabsContent>

                <TabsContent value="teams" className="mt-0 border-none p-0 outline-none">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <TeamManagement />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

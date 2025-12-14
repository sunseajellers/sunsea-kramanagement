// src/app/dashboard/admin/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllTeams, getTeamWeeklyReport } from '@/lib/teamService';
import { generateAdminReport } from '@/lib/analyticsService';
import { userHasPermission } from '@/lib/rbacService';
import { Team } from '@/types';
import { FileText, Download, Users, TrendingUp, BarChart3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';

interface WeeklyReport {
    teamId: string;
    teamName: string;
    weekStart: Date;
    weekEnd: Date;
    totalTasks: number;
    completedTasks: number;
    totalKRAs: number;
    completedKRAs: number;
    teamMembers: number;
    averageScore: number;
    topPerformers: string[];
    issues: string[];
}

export default function AdminReportsPage() {
    const { userData } = useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [selectedWeek, setSelectedWeek] = useState<string>('');
    const [report, setReport] = useState<WeeklyReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null);

    useEffect(() => {
        const checkPermission = async () => {
            if (userData?.uid) {
                try {
                    const hasAccess = await userHasPermission(userData.uid, 'admin', 'access');
                    setHasAdminAccess(hasAccess);
                } catch (error) {
                    console.error('Error checking admin permission:', error);
                    setHasAdminAccess(false);
                }
            }
        };
        checkPermission();
        loadData();
    }, [userData]);

    const loadData = async () => {
        try {
            const teamsData = await getAllTeams();
            setTeams(teamsData);
        } catch (error) {
            console.error('Failed to load data', error);
            toast.error('Failed to load data');
        }
    };

    const generateWeeklyReport = async () => {
        if (!selectedTeam || !selectedWeek) {
            toast.error('Please select a team and week');
            return;
        }

        setLoading(true);
        try {
            const reportData = await getTeamWeeklyReport(selectedTeam, selectedWeek);
            setReport(reportData);
        } catch (error) {
            console.error('Failed to generate report', error);
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const exportReport = async (format: 'pdf' | 'excel' | 'json' = 'pdf') => {
        if (!report) return;

        setGenerating(true);
        try {
            const exportData = await generateAdminReport('teams');

            // Create download link
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: format === 'json' ? 'application/json' : 'application/pdf'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `weekly-report-${report.teamName}-${selectedWeek}.${format === 'json' ? 'json' : 'pdf'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('Report exported successfully');
        } catch (error) {
            console.error('Failed to export report', error);
            toast.error('Failed to export report');
        } finally {
            setGenerating(false);
        }
    };

    const getWeekOptions = () => {
        const options = [];
        const today = new Date();

        // Generate last 12 weeks
        for (let i = 0; i < 12; i++) {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - (today.getDay() + 7 * i));

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            const weekLabel = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
            const weekValue = weekStart.toISOString().split('T')[0];

            options.push({ label: weekLabel, value: weekValue });
        }

        return options;
    };

    if (hasAdminAccess === false) {
        return <div className="p-6">Access denied</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        Weekly Reports
                    </h1>
                    <p className="text-muted-foreground">
                        Generate and manage team weekly performance reports
                    </p>
                </div>
            </div>

            {/* Report Generation Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>Generate Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Select Team</label>
                            <select
                                value={selectedTeam}
                                onChange={(e) => setSelectedTeam(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Choose a team</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Select Week</label>
                            <select
                                value={selectedWeek}
                                onChange={(e) => setSelectedWeek(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Choose a week</option>
                                {getWeekOptions().map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end">
                            <Button
                                onClick={generateWeeklyReport}
                                disabled={!selectedTeam || !selectedWeek || loading}
                                className="w-full"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <BarChart3 className="h-4 w-4 mr-2" />
                                        Generate Report
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Report Display */}
            {report && (
                <div className="space-y-6">
                    {/* Report Header */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl">{report.teamName} - Weekly Report</CardTitle>
                                    <p className="text-muted-foreground">
                                        {report.weekStart.toLocaleDateString()} - {report.weekEnd.toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => exportReport('json')}
                                        disabled={generating}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        JSON
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => exportReport('pdf')}
                                        disabled={generating}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        PDF
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Report Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <Users className="h-8 w-8 text-blue-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                                        <p className="text-2xl font-bold">{report.teamMembers}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <FileText className="h-8 w-8 text-green-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-muted-foreground">Tasks Completed</p>
                                        <p className="text-2xl font-bold">{report.completedTasks}/{report.totalTasks}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <TrendingUp className="h-8 w-8 text-purple-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-muted-foreground">KRAs Completed</p>
                                        <p className="text-2xl font-bold">{report.completedKRAs}/{report.totalKRAs}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <BarChart3 className="h-8 w-8 text-orange-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                                        <p className="text-2xl font-bold">{report.averageScore.toFixed(1)}%</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Top Performers */}
                    {report.topPerformers.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Performers</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {report.topPerformers.map((performer, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                            <span>{performer}</span>
                                            <span className="text-sm text-muted-foreground">#{index + 1}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Issues */}
                    {report.issues.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Issues & Concerns</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {report.issues.map((issue, index) => (
                                        <div key={index} className="flex items-start p-3 border-l-4 border-red-500 bg-red-50">
                                            <span className="text-sm">{issue}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
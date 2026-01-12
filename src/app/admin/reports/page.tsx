// src/app/admin/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllTeams, getTeamWeeklyReport } from '@/lib/teamService';
import { generateAdminReportAction } from '@/app/actions/analytics';
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
    useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [selectedWeek, setSelectedWeek] = useState<string>('');
    const [report, setReport] = useState<WeeklyReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

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
            const result = await generateAdminReportAction('teams');

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to generate report');
            }

            // Create download link
            const blob = new Blob([JSON.stringify(result.data, null, 2)], {
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


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <FileText className="h-7 w-7 text-blue-600" />
                        Weekly Reports
                    </h1>
                    <p className="text-sm text-gray-400 font-medium mt-1">
                        Generate and manage team weekly performance reports
                    </p>
                </div>
            </div>

            {/* Report Generation Controls - Simplified */}
            <Card className="border-none shadow-sm bg-white">
                <CardHeader className="border-b bg-gray-50/30 px-6 py-4">
                    <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">Generate Report</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Team</label>
                            <select
                                value={selectedTeam}
                                onChange={(e) => setSelectedTeam(e.target.value)}
                                className="w-full h-10 px-3 py-2 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                            >
                                <option value="">Choose a team</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Week</label>
                            <select
                                value={selectedWeek}
                                onChange={(e) => setSelectedWeek(e.target.value)}
                                className="w-full h-10 px-3 py-2 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
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
                                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
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

            {/* Report Display - Simplified */}
            {report && (
                <div className="space-y-6 animate-slide-up">
                    {/* Report Header */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <CardHeader className="border-b bg-gray-50/30 px-6 py-4">
                            <div className="flex items-center justify-between w-full">
                                <div>
                                    <CardTitle className="text-sm font-black text-gray-900 uppercase tracking-widest">
                                        {report.teamName} <span className="text-gray-400 ml-2">Weekly Report</span>
                                    </CardTitle>
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
                                        {report.weekStart.toLocaleDateString()} - {report.weekEnd.toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => exportReport('json')}
                                        disabled={generating}
                                        className="h-8 border-gray-100 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50"
                                    >
                                        <Download className="h-3.5 w-3.5 mr-2" />
                                        JSON
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => exportReport('pdf')}
                                        disabled={generating}
                                        className="h-8 border-gray-100 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50"
                                    >
                                        <Download className="h-3.5 w-3.5 mr-2" />
                                        PDF
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Report Metrics - Simplified */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Team Members', value: report.teamMembers, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
                            { label: 'Tasks Done', value: `${report.completedTasks}/${report.totalTasks}`, icon: FileText, color: 'text-green-600', bgColor: 'bg-green-50' },
                            { label: 'KRAs Done', value: `${report.completedKRAs}/${report.totalKRAs}`, icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-50' },
                            { label: 'Avg Score', value: `${report.averageScore.toFixed(1)}%`, icon: BarChart3, color: 'text-amber-600', bgColor: 'bg-amber-50' }
                        ].map((metric, i) => (
                            <Card key={i} className="border-none shadow-sm bg-white overflow-hidden">
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{metric.label}</p>
                                        <p className="text-2xl font-black text-gray-900 mt-1">{metric.value}</p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-xl ${metric.bgColor} ${metric.color} flex items-center justify-center`}>
                                        <metric.icon className="w-6 h-6" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Performers */}
                        {report.topPerformers.length > 0 && (
                            <Card className="border-none shadow-sm bg-white">
                                <CardHeader className="border-b bg-gray-50/30 px-6 py-4">
                                    <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">Top Performers</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-2">
                                        {report.topPerformers.map((performer, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100">
                                                <span className="text-sm font-bold text-gray-900">{performer}</span>
                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">#{index + 1}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Issues */}
                        {report.issues.length > 0 && (
                            <Card className="border-none shadow-sm bg-white">
                                <CardHeader className="border-b bg-gray-50/30 px-6 py-4">
                                    <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">Issues & Concerns</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-2">
                                        {report.issues.map((issue, index) => (
                                            <div key={index} className="flex items-start p-4 border-l-4 border-red-500 bg-red-50/50 rounded-r-xl">
                                                <span className="text-xs font-bold text-red-700">{issue}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
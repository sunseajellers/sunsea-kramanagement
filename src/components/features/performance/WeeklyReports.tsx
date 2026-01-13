'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllTeams, getTeamWeeklyReport } from '@/lib/teamService';
import { generateAdminReportAction } from '@/app/actions/analytics';
import { Team } from '@/types';
import { FileText, Download, Users, TrendingUp, BarChart3, Loader2, Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export default function WeeklyReports() {
    useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [selectedWeek, setSelectedWeek] = useState<string>('');
    const [report, setReport] = useState<WeeklyReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

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
        } finally {
            setInitialLoading(false);
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

        for (let i = 0; i < 12; i++) {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - (today.getDay() + 7 * i));

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            const weekValue = weekStart.toISOString().split('T')[0];

            options.push({ label: weekLabel, value: weekValue });
        }

        return options;
    };

    if (initialLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center animate-pulse">
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Loading reports catalogue...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Weekly Intelligence</h2>
                    <p className="text-gray-400 text-xs font-medium">Detailed team-level execution metrics</p>
                </div>
            </div>

            {/* Report Generator */}
            <div className="glass-card p-6">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Protocol Parameters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assigned Team</label>
                        <div className="relative">
                            <select
                                value={selectedTeam}
                                onChange={(e) => setSelectedTeam(e.target.value)}
                                className="w-full h-12 px-4 pr-10 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-black uppercase tracking-widest appearance-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer outline-none"
                            >
                                <option value="">Select Team</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Temporal Window</label>
                        <div className="relative">
                            <select
                                value={selectedWeek}
                                onChange={(e) => setSelectedWeek(e.target.value)}
                                className="w-full h-12 px-4 pr-10 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-black uppercase tracking-widest appearance-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer outline-none"
                            >
                                <option value="">Select Week</option>
                                {getWeekOptions().map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex items-end">
                        <Button
                            onClick={generateWeeklyReport}
                            disabled={!selectedTeam || !selectedWeek || loading}
                            className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-gray-100"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Compile Data
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Report Display */}
            {report ? (
                <div className="space-y-6">
                    {/* Report Header */}
                    <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-8 border-l-blue-600">
                        <div>
                            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">{report.teamName} Report</h2>
                            <p className="text-[11px] text-blue-600 font-bold uppercase tracking-widest mt-1">
                                {report.weekStart.toLocaleDateString()} — {report.weekEnd.toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => exportReport('json')}
                                disabled={generating}
                                className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-gray-100"
                            >
                                <Download className="h-3.5 w-3.5 mr-1.5" />
                                JSON
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => exportReport('pdf')}
                                disabled={generating}
                                className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-gray-100"
                            >
                                <Download className="h-3.5 w-3.5 mr-1.5" />
                                PDF
                            </Button>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Force Size', value: report.teamMembers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Task Execution', value: `${report.completedTasks}/${report.totalTasks}`, icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
                            { label: 'Objective Score', value: `${report.completedKRAs}/${report.totalKRAs}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
                            { label: 'Avg Efficiency', value: `${report.averageScore.toFixed(1)}%`, icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' }
                        ].map((metric, i) => (
                            <div key={i} className="stat-card">
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{metric.label}</p>
                                    <h3 className="text-xl font-black text-gray-900">{metric.value}</h3>
                                </div>
                                <div className={`icon-box icon-box-md ${metric.bg} ${metric.color}`}>
                                    <metric.icon className="h-5 w-5" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Performers */}
                        <div className="glass-card flex flex-col overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Efficiency Leaders</h3>
                            </div>
                            <div className="p-6 space-y-3">
                                {report.topPerformers.length > 0 ? (
                                    report.topPerformers.map((performer, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-50 rounded-2xl shadow-sm">
                                            <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{performer}</span>
                                            <span className="badge badge-info py-1 px-3 text-[9px]">RANK #{index + 1}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No Leader Data Available</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Issues */}
                        <div className="glass-card flex flex-col overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Constraint Registry</h3>
                            </div>
                            <div className="p-6 space-y-3">
                                {report.issues.length > 0 ? (
                                    report.issues.map((issue, index) => (
                                        <div key={index} className="p-4 border-l-4 border-red-500 bg-red-50/50 rounded-r-2xl">
                                            <span className="text-[11px] font-bold text-red-700 leading-relaxed">{issue}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center">
                                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                            <TrendingUp className="w-6 h-6 text-green-500" />
                                        </div>
                                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Zero Constraints Detected</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="glass-card border-dashed border-2 border-gray-100 bg-gray-50/30 py-24 text-center">
                    <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Report Engine Ready</h3>
                    <p className="text-xs text-gray-300 font-bold mt-2">Initialize parameters to compile weekly summarizes</p>
                </div>
            )}
        </div>
    );
}

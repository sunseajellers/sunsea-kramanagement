'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllTeams, getTeamWeeklyReport } from '@/lib/teamService';
import { generateAdminReportAction } from '@/app/actions/analytics';
import { Team } from '@/types';
import { FileText, Download, Users, TrendingUp, BarChart3, Loader2, Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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

    const exportReport = async (format: 'pdf' | 'excel' | 'json' | 'csv' = 'pdf') => {
        if (!report) return;

        setGenerating(true);
        try {
            const result = await generateAdminReportAction('teams');

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to generate report');
            }

            if (format === 'csv') {
                // For CSV, we probably want to flatten the data or export specific parts
                // Since report is hierarchical, let's export the top-level fields + basic flattened lists
                // Using dynamic import to avoid circular dependencies if any, though utils is safe
                const { exportToCSV } = await import('@/lib/exportUtils');
                // Create a flat representation or array of 1 item
                exportToCSV([result.data], `weekly-report-${report.teamName}-${selectedWeek}.csv`);
                toast.success('Report exported successfully');
                return;
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
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 flex items-center justify-center animate-pulse shadow-xl shadow-indigo-100/50 border border-indigo-100">
                        <FileText className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Initializing Analytics Engine</p>
                        <p className="text-sm text-slate-400 font-medium">Loading reports catalogue...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in">
            {/* Header */}
            <div className="page-header flex items-center justify-between">
                <div>
                    <h2 className="section-title">Weekly Intelligence</h2>
                    <p className="section-subtitle">Comprehensive team-level execution metrics and efficiency audit</p>
                </div>
            </div>

            {/* Protocol Parameters */}
            <div className="glass-panel p-10">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">
                        Protocol Selection Parameters
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Strategic Unit</label>
                        <div className="relative group">
                            <select
                                value={selectedTeam}
                                onChange={(e) => setSelectedTeam(e.target.value)}
                                className="form-input h-14 appearance-none px-5 bg-slate-50/50"
                            >
                                <option value="">Select Target Team</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Temporal Window</label>
                        <div className="relative group">
                            <select
                                value={selectedWeek}
                                onChange={(e) => setSelectedWeek(e.target.value)}
                                className="form-input h-14 appearance-none px-5 bg-slate-50/50"
                            >
                                <option value="">Select Audit Week</option>
                                {getWeekOptions().map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                    </div>

                    <div className="flex items-end">
                        <Button
                            onClick={generateWeeklyReport}
                            disabled={!selectedTeam || !selectedWeek || loading}
                            className="btn-primary w-full h-14"
                        >
                            {loading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <>
                                    <BarChart3 className="h-6 w-6 mr-3" />
                                    Compile Intelligence
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Intelligence Record */}
            {report ? (
                <div className="space-y-10">
                    {/* Record Header */}
                    <div className="glass-panel p-10 flex flex-col md:flex-row md:items-center justify-between gap-10 overflow-hidden relative border-l-8 border-l-indigo-600 bg-white shadow-2xl shadow-indigo-100/20 group/record">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] -rotate-6 pointer-events-none group-hover/record:rotate-0 transition-transform duration-1000">
                            <FileText className="w-56 h-56" />
                        </div>

                        <div className="relative space-y-2">
                            <div className="flex items-center gap-4">
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{report.teamName} Report</h2>
                                <span className="status-badge status-badge-success px-4 py-1.5">Operational</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                <p className="text-xs text-indigo-600 font-black uppercase tracking-[0.2em]">
                                    WINDOW: {report.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {report.weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 relative">
                            {['csv', 'json', 'pdf'].map((format) => (
                                <Button
                                    key={format}
                                    variant="outline"
                                    onClick={() => exportReport(format as any)}
                                    disabled={generating}
                                    className="h-14 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest border-2 border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all shadow-sm active:scale-95"
                                >
                                    <Download className="h-5 w-5 mr-3" />
                                    {format}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Matrix Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { label: 'Personnel Count', value: report.teamMembers, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { label: 'Task Execution', value: `${report.completedTasks}/${report.totalTasks}`, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Objective Score', value: `${report.completedKRAs}/${report.totalKRAs}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
                            { label: 'Efficiency Index', value: `${report.averageScore.toFixed(1)}%`, icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' }
                        ].map((metric, i) => (
                            <div key={i} className="dashboard-card group">
                                <div className="flex flex-col gap-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">{metric.label}</p>
                                    <h3 className="text-4xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">{metric.value}</h3>
                                </div>
                                <div className={cn("w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all group-hover:scale-110 shadow-sm", metric.bg, metric.color)}>
                                    <metric.icon className="h-7 w-7" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Detailed Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Elite Performers */}
                        <div className="glass-panel p-0 flex flex-col overflow-hidden group/box">
                            <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm flex items-center justify-between">
                                <div>
                                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Efficiency Vanguard</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Personnel Ranking Matrix</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-sm">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="p-10 space-y-6">
                                {report.topPerformers.length > 0 ? (
                                    report.topPerformers.map((performer, index) => (
                                        <div key={index} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group/item">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xs font-black text-slate-400 border border-slate-100 group-hover/item:border-indigo-100 group-hover/item:bg-indigo-50 group-hover/item:text-indigo-600 transition-all">
                                                    {(index + 1).toString().padStart(2, '0')}
                                                </div>
                                                <span className="text-base font-black text-slate-900 uppercase tracking-tight">{performer}</span>
                                            </div>
                                            <span className="status-badge status-badge-success px-4 py-1.5 text-[10px]">ELITE TIER</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-24 text-center flex flex-col items-center">
                                        <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
                                            <Users className="w-10 h-10" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">No Vanguard Data Available</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Constraint Registry */}
                        <div className="glass-panel p-0 flex flex-col overflow-hidden group/box">
                            <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm flex items-center justify-between">
                                <div>
                                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Constraint Registry</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Impediment Log</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm relative">
                                    <div className="absolute inset-0 bg-rose-500/20 rounded-xl animate-ping" />
                                    <BarChart3 className="w-5 h-5 relative" />
                                </div>
                            </div>
                            <div className="p-10 space-y-6">
                                {report.issues.length > 0 ? (
                                    report.issues.map((issue, index) => (
                                        <div key={index} className="p-6 border-l-4 border-l-rose-500 bg-rose-50/30 rounded-r-[2rem] flex items-start gap-5 group/issue hover:bg-rose-50 transition-colors">
                                            <span className="text-[10px] font-black text-rose-500 mt-1 uppercase tracking-widest">ERR-{(index + 1).toString().padStart(2, '0')}</span>
                                            <span className="text-sm font-bold text-slate-700 leading-relaxed uppercase tracking-tight">{issue}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-24 text-center flex flex-col items-center">
                                        <div className="w-20 h-20 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-100/50 border-2 border-white ring-4 ring-emerald-50/50">
                                            <TrendingUp className="w-10 h-10 text-emerald-500" />
                                        </div>
                                        <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.3em]">Zero System Impediments</p>
                                        <p className="text-sm text-slate-400 font-medium mt-2 uppercase tracking-tight">Optimal performance equilibrium reached</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="glass-panel border-dashed border-4 border-slate-100 bg-slate-50/30 py-40 text-center rounded-[3.5rem] hover:border-indigo-100 hover:bg-indigo-50/20 transition-all duration-700 group/standby">
                    <div className="w-28 h-28 rounded-[3.5rem] bg-white border border-slate-100 flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-indigo-100/30 group-hover/standby:scale-110 transition-transform duration-700">
                        <FileText className="w-14 h-14 text-slate-200 group-hover/standby:text-indigo-200 transition-colors" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tight mb-3">Intelligence Standby</h3>
                    <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">Initialize tactical parameters to compile organization-wide weekly summaries and personnel throughput.</p>
                </div>
            )}
        </div>
    );
}

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
    exportReportAsJSON
} from '@/lib/reportService'
import { authenticatedJsonFetch } from '@/lib/apiClient'
import { WeeklyReport, ScoringConfig } from '@/types'
import {
    FileText,
    Download,
    Calendar,
    TrendingUp,
    Award,
    Clock,
    CheckCircle2,
    Target,
    Loader2,
    RefreshCw
} from 'lucide-react'

export default function WeeklyReportsPage() {
    const { user } = useAuth()
    const [reports, setReports] = useState<WeeklyReport[]>([])
    const [scoringConfig, setScoringConfig] = useState<ScoringConfig | null>(null)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        loadData()
    }, [user])

    const loadData = async () => {
        if (!user) return
        setLoading(true)
        try {
            const [reportsResult, configResult] = await Promise.all([
                authenticatedJsonFetch('/api/reports?limit=10', {
                    headers: {
                        'x-user-id': user.uid
                    }
                }),
                authenticatedJsonFetch('/api/scoring/config')
            ])
            
            if (reportsResult.success && reportsResult.data) {
                setReports(reportsResult.data.reports)
            } else {
                throw new Error(reportsResult.error || 'Failed to load reports')
            }
            
            if (configResult.success && configResult.data) {
                setScoringConfig(configResult.data.config)
            } else {
                throw new Error(configResult.error || 'Failed to load scoring config')
            }
        } catch (error) {
            console.error('Failed to load reports', error)
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateReport = async () => {
        if (!user) return
        setGenerating(true)
        try {
            // Get current week start and end
            const now = new Date()
            const dayOfWeek = now.getDay()
            const weekStart = new Date(now)
            weekStart.setDate(now.getDate() - dayOfWeek)
            weekStart.setHours(0, 0, 0, 0)

            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekStart.getDate() + 6)
            weekEnd.setHours(23, 59, 59, 999)

            const result = await authenticatedJsonFetch('/api/reports', {
                method: 'POST',
                headers: {
                    'x-user-id': user.uid
                },
                body: JSON.stringify({
                    userName: user.displayName || user.email || 'User',
                    weekStart: weekStart.toISOString(),
                    weekEnd: weekEnd.toISOString(),
                }),
            });
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to generate report');
            }
            
            await loadData()
        } catch (error) {
            console.error('Failed to generate report', error)
            alert('Failed to generate weekly report. Please try again.')
        } finally {
            setGenerating(false)
        }
    }

    const handleExportReport = (report: WeeklyReport) => {
        exportReportAsJSON(report)
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-100'
        if (score >= 60) return 'text-blue-600 bg-blue-100'
        if (score >= 40) return 'text-yellow-600 bg-yellow-100'
        return 'text-red-600 bg-red-100'
    }

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent'
        if (score >= 60) return 'Good'
        if (score >= 40) return 'Fair'
        return 'Needs Improvement'
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600 mb-4" />
                <p className="text-gray-500 font-medium">Loading weekly reports...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            <FileText className="w-8 h-8 mr-3 text-primary-600" />
                            Weekly Reports
                        </h1>
                        <p className="text-gray-500 mt-1">Track your weekly performance and progress</p>
                    </div>
                    <button
                        onClick={handleGenerateReport}
                        disabled={generating}
                        className="btn-primary flex items-center justify-center sm:w-auto w-full"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-5 h-5 mr-2" />
                                Generate This Week's Report
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Scoring Configuration Info */}
            {scoringConfig && (
                <div className="bg-gradient-to-br from-primary-50 to-secondary-50 p-6 rounded-2xl border border-primary-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <Award className="w-5 h-5 mr-2 text-primary-600" />
                        Current Scoring Weights
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Completion</p>
                            <p className="text-2xl font-bold text-primary-600">{scoringConfig.completionWeight}%</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Timeliness</p>
                            <p className="text-2xl font-bold text-blue-600">{scoringConfig.timelinessWeight}%</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Quality</p>
                            <p className="text-2xl font-bold text-green-600">{scoringConfig.qualityWeight}%</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">KRA Alignment</p>
                            <p className="text-2xl font-bold text-purple-600">{scoringConfig.kraAlignmentWeight}%</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Reports List */}
            {reports.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Yet</h3>
                    <p className="text-gray-500 mb-6">Generate your first weekly report to track your progress</p>
                    <button
                        onClick={handleGenerateReport}
                        disabled={generating}
                        className="btn-primary inline-flex items-center"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-5 h-5 mr-2" />
                                Generate Report
                            </>
                        )}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {reports.map(report => (
                        <div key={report.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                                <div>
                                    <div className="flex items-center space-x-3 mb-2">
                                        <Calendar className="w-5 h-5 text-gray-600" />
                                        <h3 className="text-lg font-bold text-gray-900">
                                            {formatDate(report.weekStartDate)} - {formatDate(report.weekEndDate)}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Generated on {formatDate(report.generatedAt)}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className={`px-6 py-3 rounded-xl ${getScoreColor(report.score)}`}>
                                        <p className="text-xs font-medium mb-1">Overall Score</p>
                                        <p className="text-3xl font-bold">{report.score}</p>
                                        <p className="text-xs mt-1">{getScoreLabel(report.score)}</p>
                                    </div>
                                    <button
                                        onClick={() => handleExportReport(report)}
                                        className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Export Report"
                                    >
                                        <Download className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-medium text-blue-600">Tasks Assigned</p>
                                        <Target className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <p className="text-2xl font-bold text-blue-700">{report.tasksAssigned}</p>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-medium text-green-600">Completed</p>
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    </div>
                                    <p className="text-2xl font-bold text-green-700">{report.tasksCompleted}</p>
                                </div>

                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-medium text-purple-600">On Time</p>
                                        <Clock className="w-4 h-4 text-purple-500" />
                                    </div>
                                    <p className="text-2xl font-bold text-purple-700">{report.onTimePercentage}%</p>
                                </div>

                                <div className="bg-orange-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-medium text-orange-600">KRAs Covered</p>
                                        <TrendingUp className="w-4 h-4 text-orange-500" />
                                    </div>
                                    <p className="text-2xl font-bold text-orange-700">{report.krasCovered.length}</p>
                                </div>
                            </div>

                            {/* Score Breakdown */}
                            <div className="border-t border-gray-200 pt-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Score Breakdown</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Completion</p>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-primary-600 h-2 rounded-full"
                                                    style={{ width: `${report.breakdown.completionScore}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-gray-700">
                                                {report.breakdown.completionScore}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Timeliness</p>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{ width: `${report.breakdown.timelinessScore}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-gray-700">
                                                {report.breakdown.timelinessScore}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Quality</p>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-green-600 h-2 rounded-full"
                                                    style={{ width: `${report.breakdown.qualityScore}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-gray-700">
                                                {report.breakdown.qualityScore}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">KRA Alignment</p>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-purple-600 h-2 rounded-full"
                                                    style={{ width: `${report.breakdown.kraAlignmentScore}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-gray-700">
                                                {report.breakdown.kraAlignmentScore}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

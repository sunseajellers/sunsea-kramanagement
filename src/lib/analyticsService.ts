// src/lib/analyticsService.ts
import 'server-only'
import { DashboardStats, Task, KRA } from '@/types';
import { getUserTasks } from './taskService';
import { getUserKRAs } from './kraService';
import { getAllUsers } from './userService';
import { getAllTeams } from './teamService';
import { handleError, timestampToDate } from './utils';
import { adminDb } from './firebase-admin';

/**
 * Simple aggregation for a user's dashboard.
 */
export async function getDashboardStats(uid: string): Promise<DashboardStats> {
    try {
        // Fetch tasks for the user
        const tasksSnap = await adminDb.collection('tasks').where('assignedTo', 'array-contains', uid).get();
        const tasks = tasksSnap.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                dueDate: timestampToDate(data.dueDate),
                createdAt: timestampToDate(data.createdAt),
                updatedAt: timestampToDate(data.updatedAt)
            };
        }) as Task[];
        // Fetch KRAs for the user
        const krasSnap = await adminDb.collection('kras').where('assignedTo', 'array-contains', uid).get();
        const kras = krasSnap.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                dueDate: timestampToDate(data.dueDate),
                createdAt: timestampToDate(data.createdAt),
                updatedAt: timestampToDate(data.updatedAt)
            };
        }) as any as KRA[];

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === 'completed').length;
        const pendingTasks = tasks.filter((t) => t.status === 'assigned' || t.status === 'in_progress').length;
        const overdueTasks = tasks.filter((t) => {
            const now = new Date();
            return t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed';
        }).length;

        const activeKRAs = kras.filter((k) => k.status === 'in_progress').length;
        const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const weeklyScore = Math.min(100, completionRate + activeKRAs * 2); // dummy calculation

        return {
            totalTasks,
            completedTasks,
            pendingTasks,
            overdueTasks,
            activeKRAs,
            completionRate,
            weeklyScore,
        };
    } catch (error) {
        handleError(error, 'Failed to fetch dashboard stats');
        throw error;
    }
}

export async function getTaskAnalytics(uid: string) {
    try {
        const tasksSnap = await adminDb.collection('tasks').where('assignedTo', 'array-contains', uid).get();
        const tasks = tasksSnap.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                dueDate: timestampToDate(data.dueDate),
                createdAt: timestampToDate(data.createdAt),
                updatedAt: timestampToDate(data.updatedAt)
            };
        }) as Task[];

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === 'completed').length;
        const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
        const pendingTasks = tasks.filter((t) => t.status === 'assigned').length; // 'assigned' maps to pending in UI often
        const overdueTasks = tasks.filter((t) => {
            const now = new Date();
            return t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed';
        }).length;

        const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Calculate Status Distribution
        const tasksByStatus = {
            pending: tasks.filter(t => t.status === 'assigned').length,
            'in-progress': tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            blocked: tasks.filter(t => t.status === 'blocked').length
        };

        // Calculate Priority Distribution
        const tasksByPriority = {
            low: tasks.filter(t => t.priority === 'low').length,
            medium: tasks.filter(t => t.priority === 'medium').length,
            high: tasks.filter(t => t.priority === 'high').length,
            critical: tasks.filter(t => t.priority === 'critical').length
        };

        // Mock Trend Data (Last 7 days) - In a real app, you'd aggregate this from createdAt/completedAt
        const tasksOverTime = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return {
                date: d.toLocaleDateString('en-US', { weekday: 'short' }),
                created: Math.floor(Math.random() * 5), // Mock
                completed: Math.floor(Math.random() * 5) // Mock
            };
        });

        return {
            totalTasks,
            completedTasks,
            inProgressTasks,
            pendingTasks,
            overdueTasks,
            completionRate,
            tasksByStatus,
            tasksByPriority,
            tasksOverTime
        };
    } catch (error) {
        handleError(error, 'Failed to fetch task analytics');
        throw error;
    }
}

export async function getKRAAnalytics(uid: string) {
    try {
        const krasSnap = await adminDb.collection('kras').where('assignedTo', 'array-contains', uid).get();
        const kras = krasSnap.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                dueDate: timestampToDate(data.dueDate),
                createdAt: timestampToDate(data.createdAt),
                updatedAt: timestampToDate(data.updatedAt)
            };
        }) as any as KRA[];

        const totalKRAs = kras.length;
        const activeKRAs = kras.filter(k => k.status === 'in_progress').length;

        // Mock Progress Data - In a real app, this would come from linked tasks
        const kraProgress = kras.slice(0, 5).map(kra => ({
            name: kra.title,
            tasksTotal: 10, // Mock
            tasksCompleted: Math.floor(Math.random() * 10), // Mock
            percentage: Math.floor(Math.random() * 100) // Mock
        }));

        return {
            totalKRAs,
            activeKRAs,
            kraProgress
        };
    } catch (error) {
        handleError(error, 'Failed to fetch KRA analytics');
        throw error;
    }
}

export async function exportAnalyticsData(uid: string) {
    // Placeholder for export functionality
    console.log('Exporting analytics for', uid);
    return true;
}

// ===== ADMIN-ONLY ANALYTICS FUNCTIONS =====

/**
 * Get comprehensive admin dashboard analytics
 */
export async function getAdminDashboardAnalytics() {
    try {
        const [users, teams] = await Promise.all([
            getAllUsers(),
            getAllTeams()
        ]);

        // Get all tasks and KRAs for comprehensive analysis
        const allTasksPromises = users.map(user => getUserTasks(user.id));
        const allKRAsPromises = users.map(user => getUserKRAs(user.id));

        const [allTasksArrays, allKRAsArrays] = await Promise.all([
            Promise.all(allTasksPromises),
            Promise.all(allKRAsPromises)
        ]);

        const allTasks = allTasksArrays.flat();
        const allKRAs = allKRAsArrays.flat();

        // Remove duplicates (users might have overlapping team KRAs)
        const uniqueKRAs = allKRAs.filter((kra, index, self) =>
            index === self.findIndex(k => k.id === kra.id)
        );

        // Calculate comprehensive metrics
        const totalUsers = users.length;
        const totalTeams = teams.length;
        const totalTasks = allTasks.length;
        const totalKRAs = uniqueKRAs.length;

        const completedTasks = allTasks.filter(t => t.status === 'completed').length;
        const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
        const overdueTasks = allTasks.filter(t => {
            const now = new Date();
            return t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed';
        }).length;

        const activeKRAs = uniqueKRAs.filter(k => k.status === 'in_progress').length;
        const completedKRAs = uniqueKRAs.filter(k => k.status === 'completed').length;

        // Team performance metrics
        const teamPerformance = teams.map(team => {
            const teamMembers = users.filter(u => u.teamId === team.id);
            const teamTasks = allTasks.filter(t => teamMembers.some(m => t.assignedTo.includes(m.id)));
            const teamKRAs = uniqueKRAs.filter(k => teamMembers.some(m => k.assignedTo.includes(m.id) || k.teamIds?.includes(team.id)));

            const completedTeamTasks = teamTasks.filter(t => t.status === 'completed').length;
            const teamCompletionRate = teamTasks.length ? Math.round((completedTeamTasks / teamTasks.length) * 100) : 0;

            return {
                teamId: team.id,
                teamName: team.name,
                memberCount: teamMembers.length,
                totalTasks: teamTasks.length,
                completedTasks: completedTeamTasks,
                completionRate: teamCompletionRate,
                activeKRAs: teamKRAs.filter(k => k.status === 'in_progress').length,
                totalKRAs: teamKRAs.length
            };
        });

        // User performance metrics
        const userPerformance = users.map(user => {
            const userTasks = allTasks.filter(t => t.assignedTo.includes(user.id));
            const userKRAs = uniqueKRAs.filter(k => k.assignedTo.includes(user.id) || k.teamIds?.includes(user.teamId || ''));

            const completedUserTasks = userTasks.filter(t => t.status === 'completed').length;
            const userCompletionRate = userTasks.length ? Math.round((completedUserTasks / userTasks.length) * 100) : 0;

            return {
                userId: user.id,
                userName: user.fullName,
                role: 'Employee',
                teamName: teams.find(t => t.id === user.teamId)?.name || 'No Team',
                totalTasks: userTasks.length,
                completedTasks: completedUserTasks,
                completionRate: userCompletionRate,
                activeKRAs: userKRAs.filter(k => k.status === 'in_progress').length,
                totalKRAs: userKRAs.length
            };
        });

        // Time-based analytics (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentTasks = allTasks.filter(t => new Date(t.createdAt) >= thirtyDaysAgo);
        const recentKRAs = uniqueKRAs.filter(k => new Date(k.createdAt) >= thirtyDaysAgo);

        // Priority distribution
        const priorityDistribution = {
            low: allTasks.filter(t => t.priority === 'low').length,
            medium: allTasks.filter(t => t.priority === 'medium').length,
            high: allTasks.filter(t => t.priority === 'high').length,
            critical: allTasks.filter(t => t.priority === 'critical').length
        };

        // KRA type distribution
        const kraTypeDistribution = {
            daily: uniqueKRAs.filter(k => k.type === 'daily').length,
            weekly: uniqueKRAs.filter(k => k.type === 'weekly').length,
            monthly: uniqueKRAs.filter(k => k.type === 'monthly').length
        };

        return {
            overview: {
                totalUsers,
                totalTeams,
                totalTasks,
                totalKRAs,
                completedTasks,
                inProgressTasks,
                overdueTasks,
                activeKRAs,
                completedKRAs,
                overallCompletionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0
            },
            teamPerformance,
            userPerformance,
            recentActivity: {
                tasksCreated: recentTasks.length,
                krasCreated: recentKRAs.length,
                tasksCompleted: recentTasks.filter(t => t.status === 'completed').length
            },
            distributions: {
                priority: priorityDistribution,
                kraTypes: kraTypeDistribution
            }
        };
    } catch (error) {
        handleError(error, 'Failed to fetch admin analytics');
        throw error;
    }
}

/**
 * Get detailed team analytics for admin reports
 */
export async function getTeamDetailedAnalytics(teamId: string) {
    try {
        const [users, team] = await Promise.all([
            getAllUsers(),
            getAllTeams().then(teams => teams.find(t => t.id === teamId))
        ]);

        if (!team) throw new Error('Team not found');

        const teamMembers = users.filter(u => u.teamId === teamId);

        // Get all tasks and KRAs for team members
        const memberTasksPromises = teamMembers.map(user => getUserTasks(user.id));
        const memberKRAsPromises = teamMembers.map(user => getUserKRAs(user.id));

        const [memberTasksArrays, memberKRAsArrays] = await Promise.all([
            Promise.all(memberTasksPromises),
            Promise.all(memberKRAsPromises)
        ]);

        const allMemberTasks = memberTasksArrays.flat();
        const allMemberKRAs = memberKRAsArrays.flat();

        // Remove duplicates
        const uniqueMemberKRAs = allMemberKRAs.filter((kra, index, self) =>
            index === self.findIndex(k => k.id === kra.id)
        );

        // Calculate team metrics
        const totalTasks = allMemberTasks.length;
        const completedTasks = allMemberTasks.filter(t => t.status === 'completed').length;
        const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Member performance breakdown
        const memberPerformance = teamMembers.map(member => {
            const memberTasks = allMemberTasks.filter(t => t.assignedTo.includes(member.id));
            const memberKRAs = uniqueMemberKRAs.filter(k =>
                k.assignedTo.includes(member.id) || k.teamIds?.includes(teamId)
            );

            return {
                userId: member.id,
                userName: member.fullName,
                role: 'Employee',
                tasksAssigned: memberTasks.length,
                tasksCompleted: memberTasks.filter(t => t.status === 'completed').length,
                krasAssigned: memberKRAs.length,
                krasActive: memberKRAs.filter(k => k.status === 'in_progress').length,
                completionRate: memberTasks.length ? Math.round((memberTasks.filter(t => t.status === 'completed').length / memberTasks.length) * 100) : 0
            };
        });

        // Weekly progress tracking (last 4 weeks)
        const weeklyProgress = [];
        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (i * 7) - 6);
            const weekEnd = new Date();
            weekEnd.setDate(weekEnd.getDate() - (i * 7));

            const weekTasks = allMemberTasks.filter(t => {
                const created = new Date(t.createdAt);
                return created >= weekStart && created <= weekEnd;
            });

            const weekCompletedTasks = weekTasks.filter(t => t.status === 'completed');

            weeklyProgress.push({
                week: `Week ${4 - i}`,
                startDate: weekStart.toISOString().split('T')[0],
                endDate: weekEnd.toISOString().split('T')[0],
                tasksCreated: weekTasks.length,
                tasksCompleted: weekCompletedTasks.length,
                completionRate: weekTasks.length ? Math.round((weekCompletedTasks.length / weekTasks.length) * 100) : 0
            });
        }

        return {
            teamInfo: {
                id: team.id,
                name: team.name,
                description: team.description,
                managerId: team.managerId,
                managerName: users.find(u => u.id === team.managerId)?.fullName || 'Unknown',
                memberCount: teamMembers.length
            },
            performance: {
                totalTasks,
                completedTasks,
                completionRate,
                activeKRAs: uniqueMemberKRAs.filter(k => k.status === 'in_progress').length,
                totalKRAs: uniqueMemberKRAs.length
            },
            memberPerformance,
            weeklyProgress,
            recentActivity: {
                overdueTasks: allMemberTasks.filter(t => {
                    const now = new Date();
                    return t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed';
                }).length,
                blockedTasks: allMemberTasks.filter(t => t.status === 'blocked').length,
                highPriorityTasks: allMemberTasks.filter(t => t.priority === 'high' || t.priority === 'critical').length
            }
        };
    } catch (error) {
        handleError(error, 'Failed to fetch team detailed analytics');
        throw error;
    }
}

/**
 * Generate comprehensive reports for export
 */
export async function generateAdminReport(reportType: 'overview' | 'teams' | 'users' | 'performance', dateRange?: { start: Date, end: Date }) {
    try {
        const analytics = await getAdminDashboardAnalytics();

        let reportData;

        switch (reportType) {
            case 'overview':
                reportData = {
                    generatedAt: new Date().toISOString(),
                    dateRange: dateRange || { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() },
                    summary: analytics.overview,
                    distributions: analytics.distributions,
                    recentActivity: analytics.recentActivity
                };
                break;

            case 'teams':
                reportData = {
                    generatedAt: new Date().toISOString(),
                    teams: analytics.teamPerformance,
                    summary: {
                        totalTeams: analytics.teamPerformance.length,
                        avgCompletionRate: Math.round(analytics.teamPerformance.reduce((sum, team) => sum + team.completionRate, 0) / analytics.teamPerformance.length),
                        topPerformingTeam: analytics.teamPerformance.sort((a, b) => b.completionRate - a.completionRate)[0]
                    }
                };
                break;

            case 'users':
                reportData = {
                    generatedAt: new Date().toISOString(),
                    users: analytics.userPerformance,
                    summary: {
                        totalUsers: analytics.userPerformance.length,
                        avgCompletionRate: Math.round(analytics.userPerformance.reduce((sum, user) => sum + user.completionRate, 0) / analytics.userPerformance.length),
                        topPerformers: analytics.userPerformance.sort((a, b) => b.completionRate - a.completionRate).slice(0, 5)
                    }
                };
                break;

            case 'performance':
                reportData = {
                    generatedAt: new Date().toISOString(),
                    overallMetrics: analytics.overview,
                    trends: analytics.recentActivity,
                    insights: {
                        completionTrend: analytics.overview.overallCompletionRate >= 75 ? 'Excellent' : analytics.overview.overallCompletionRate >= 50 ? 'Good' : 'Needs Improvement',
                        overdueRatio: Math.round((analytics.overview.overdueTasks / analytics.overview.totalTasks) * 100),
                        activeEngagement: Math.round((analytics.overview.inProgressTasks / analytics.overview.totalTasks) * 100)
                    }
                };
                break;
        }

        return reportData;
    } catch (error) {
        handleError(error, 'Failed to generate admin report');
        throw error;
    }
}

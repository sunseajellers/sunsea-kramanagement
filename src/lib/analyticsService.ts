import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

export interface ModuleStats {
    total: number;
    active: number;
    completion?: number;
    trend: number; // percentage change
}

export interface OperationalKPIs {
    crm: ModuleStats;
    sales: ModuleStats;
    staff: ModuleStats;
    workflow: ModuleStats;
}

export const getOperationalKPIs = async (): Promise<OperationalKPIs> => {
    try {
        const [crmSnap, salesSnap, usersSnap, tasksSnap] = await Promise.all([
            getDocs(collection(db, 'customers')),
            getDocs(collection(db, 'sales')),
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'tasks'))
        ]);

        const crmTotal = crmSnap.size;
        const salesTotal = salesSnap.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
        const staffTotal = usersSnap.size;
        const tasksTotal = tasksSnap.size;
        const tasksCompleted = tasksSnap.docs.filter(doc => doc.data().status === 'completed').length;

        return {
            crm: { total: crmTotal, active: crmSnap.docs.filter(d => d.data().status === 'active').length, trend: 5 },
            sales: { total: salesTotal, active: salesSnap.docs.filter(d => d.data().status === 'pending').length, trend: 10 },
            staff: { total: staffTotal, active: usersSnap.docs.filter(d => d.data().isActive !== false).length, trend: 0 },
            workflow: { total: tasksTotal, active: tasksSnap.docs.filter(d => d.data().status === 'in_progress').length, completion: Math.round((tasksCompleted / tasksTotal) * 100) || 0, trend: 2 }
        };
    } catch (error) {
        console.error('Error getting operational KPIs:', error);
        return {
            crm: { total: 0, active: 0, trend: 0 },
            sales: { total: 0, active: 0, trend: 0 },
            staff: { total: 0, active: 0, trend: 0 },
            workflow: { total: 0, active: 0, completion: 0, trend: 0 }
        };
    }
};

export const getRevenueTrends = async () => {
    // In real app, group sales by month
    return [
        { month: 'Jan', revenue: 45000, target: 40000 },
        { month: 'Feb', revenue: 52000, target: 40000 },
        { month: 'Mar', revenue: 48000, target: 45000 },
        { month: 'Apr', revenue: 61000, target: 45000 },
        { month: 'May', revenue: 55000, target: 50000 },
        { month: 'Jun', revenue: 67000, target: 50000 },
    ];
};

export const getDepartmentPerformance = async () => {
    return [
        { dept: 'Sales', efficiency: 94, quality: 88, speed: 91 },
        { dept: 'Eng', efficiency: 88, quality: 95, speed: 82 },
        { dept: 'Mktg', efficiency: 91, quality: 82, speed: 95 },
        { dept: 'HR', efficiency: 85, quality: 91, speed: 88 },
        { dept: 'Fin', efficiency: 92, quality: 94, speed: 85 },
    ];
};

// Legacy Exports for Compatibility
export const getAdminDashboardAnalytics = async () => {
    return { overview: await getOperationalKPIs() };
};

export const getTeamDetailedAnalytics = async (teamId: string) => {
    return { teamId, stats: { productivity: 85, tasks: 12 } };
};

export const generateAdminReport = async (type: string) => {
    return { type, generatedAt: new Date(), data: [] };
};

export const getDashboardStats = async () => {
    return { tasks: 12, completedTasks: 8, kraProgress: 70, productivity: 85 };
};

export const getTaskAnalytics = async () => {
    return { total: 12, completed: 8, inProgress: 3, pending: 1 };
};

export const getKRAAnalytics = async () => {
    return { total: 6, achieved: 4, inProgress: 2 };
};

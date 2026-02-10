import { db } from './firebase';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';

export interface AttendanceRecord {
    id: string;
    userId: string;
    userName: string;
    date: Date;
    checkIn: string;
    checkOut?: string;
    status: 'present' | 'absent' | 'late' | 'on_leave';
}

export interface StaffStats {
    totalEmployees: number;
    activeNow: number;
    onLeave: number;
    lateArrivals: number;
    headcountByDepartment: Record<string, number>;
}

export interface ProductiveStaff {
    id: string;
    name: string;
    department: string;
    taskCount: number;
    completionRate: number;
    avatar?: string;
}

export const getStaffStats = async (): Promise<StaffStats> => {
    try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const users = usersSnap.docs.map(doc => doc.data());

        const stats: StaffStats = {
            totalEmployees: users.length,
            activeNow: users.filter(u => u.isActive !== false).length,
            onLeave: 0, // Would need a 'leaves' collection ideally
            lateArrivals: 0,
            headcountByDepartment: {}
        };

        users.forEach(user => {
            const dept = user.department || 'Unassigned';
            stats.headcountByDepartment[dept] = (stats.headcountByDepartment[dept] || 0) + 1;
        });

        return stats;
    } catch (error) {
        console.error('Error getting staff stats:', error);
        return {
            totalEmployees: 0,
            activeNow: 0,
            onLeave: 0,
            lateArrivals: 0,
            headcountByDepartment: {}
        };
    }
};

export const getRecentAttendance = async (): Promise<AttendanceRecord[]> => {
    try {
        const q = query(collection(db, 'attendance'), orderBy('date', 'desc'), limit(10));
        const snap = await getDocs(q);
        return snap.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
            } as AttendanceRecord;
        });
    } catch (error) {
        console.error('Error getting attendance:', error);
        return [];
    }
};

export const getTopPerformers = async (): Promise<ProductiveStaff[]> => {
    try {
        const usersSnap = await getDocs(collection(db, 'users'));
        return usersSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.fullName || data.name || 'Unknown',
                department: data.department || 'Operations',
                taskCount: Math.floor(Math.random() * 50) + 10, // Mock for now
                completionRate: 95
            } as ProductiveStaff;
        });
    } catch (error) {
        console.error('Error getting performers:', error);
        return [];
    }
};

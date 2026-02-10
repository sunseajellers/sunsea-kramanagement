import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { LeaveRequest } from '@/types';

// --- Leave Management ---

export const submitLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'status' | 'createdAt' | 'approvedBy'>) => {
    try {
        const docRef = await addDoc(collection(db, 'leave_requests'), {
            ...request,
            status: 'pending',
            createdAt: Timestamp.now(),
            startDate: Timestamp.fromDate(request.startDate),
            endDate: Timestamp.fromDate(request.endDate)
        });
        return docRef.id;
    } catch (error) {
        console.error('Error submitting leave request:', error);
        throw error;
    }
};

export const getLeaveRequests = async (userId?: string, status?: string): Promise<LeaveRequest[]> => {
    try {
        let q = query(collection(db, 'leave_requests'), orderBy('createdAt', 'desc'));

        if (userId) {
            q = query(q, where('userId', '==', userId));
        }

        if (status) {
            q = query(q, where('status', '==', status));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                startDate: data.startDate.toDate(),
                endDate: data.endDate.toDate(),
                createdAt: data.createdAt.toDate()
            } as LeaveRequest;
        });
    } catch (error) {
        console.error('Error fetching leave requests:', error);
        return [];
    }
};

export const updateLeaveStatus = async (requestId: string, status: 'approved' | 'rejected', approverId: string) => {
    try {
        await updateDoc(doc(db, 'leave_requests', requestId), {
            status,
            approvedBy: approverId
        });
        return true;
    } catch (error) {
        console.error('Error updating leave status:', error);
        throw error;
    }
};

// --- Asset Management (Placeholder for next step) ---
export const getAssets = async () => {
    return []; // To be implemented
};

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { adminDb } from '@/lib/firebase-admin';

export interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    action: string; // e.g., 'task_created', 'task_completed', 'kra_assigned'
    module: string; // e.g., 'tasks', 'kras', 'users', 'teams'
    resourceId: string; // ID of the affected resource
    resourceName: string; // Name/title of the resource
    changes?: Record<string, { old: any; new: any }>; // Before/after values
    details?: string; // Additional description
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}

// Helper to convert Firestore Timestamp to Date
const timestampToDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp._seconds) return new Date(timestamp._seconds * 1000);
    return new Date(timestamp);
};

// POST /api/activity-log - Create activity log entry
export async function POST(request: NextRequest) {
    return withAuth(request, async (_request: NextRequest, userId: string) => {
        try {
            const body = await request.json();
            const {
                action,
                module,
                resourceId,
                resourceName,
                changes,
                details
            } = body;

            // Get user info
            const userDoc = await adminDb.collection('users').doc(userId).get();
            const userData = userDoc.data();

            // Get IP address and user agent
            const ipAddress = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'Unknown';
            const userAgent = request.headers.get('user-agent') || 'Unknown';

            // Create activity log entry
            const activity: ActivityLog = {
                id: '', // Will be set by Firestore
                userId,
                userName: userData?.fullName || userData?.email || 'Unknown User',
                action,
                module,
                resourceId,
                resourceName,
                changes,
                details,
                ipAddress,
                userAgent,
                timestamp: new Date()
            };

            // Save to Firestore
            const docRef = await adminDb.collection('activityLogs').add({
                ...activity,
                timestamp: new Date()
            });

            return NextResponse.json({
                success: true,
                id: docRef.id,
                message: 'Activity logged successfully'
            });
        } catch (error) {
            console.error('Error logging activity:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to log activity' },
                { status: 500 }
            );
        }
    });
}

// GET /api/activity-log - Get activity logs with filters
export async function GET(request: NextRequest) {
    return withAuth(request, async (_request: NextRequest, userId: string) => {
        try {
            const { searchParams } = new URL(request.url);
            const limit = parseInt(searchParams.get('limit') || '50', 10);
            const module = searchParams.get('module');
            const action = searchParams.get('action');
            const userId_filter = searchParams.get('userId');
            const resourceId = searchParams.get('resourceId');
            const days = parseInt(searchParams.get('days') || '7', 10);

            // Build query
            let query: any = adminDb.collection('activityLogs');

            // Check if user is admin (only admins can see all activity logs)
            const userDoc = await adminDb.collection('users').doc(userId).get();
            const isAdmin = userDoc.data()?.isAdmin === true;

            // Apply ownership filter for non-admins
            if (!isAdmin) {
                query = query.where('userId', '==', userId);
            } else if (userId_filter) {
                // Admins can filter by userId if provided
                query = query.where('userId', '==', userId_filter);
            }

            // Filter by date (last N days)
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - days);
            query = query.where('timestamp', '>=', dateThreshold);

            // Apply other filters if provided
            if (module) {
                query = query.where('module', '==', module);
            }
            if (action) {
                query = query.where('action', '==', action);
            }
            if (resourceId) {
                query = query.where('resourceId', '==', resourceId);
            }

            // Order by timestamp descending and limit
            query = query.orderBy('timestamp', 'desc').limit(limit);

            const snapshot = await query.get();
            const logs = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                timestamp: timestampToDate(doc.data().timestamp)
            })) as (ActivityLog & { id: string })[];

            return NextResponse.json({
                success: true,
                logs,
                count: logs.length,
                serverTime: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error fetching activity logs:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return NextResponse.json(
                { success: false, error: `API_ERROR: ${errorMessage}` },
                { status: 500 }
            );
        }
    });
}

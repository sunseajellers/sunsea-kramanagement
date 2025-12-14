import { NextRequest, NextResponse } from 'next/server';
import { getUserKRAs } from '@/lib/kraService';
import { getAllTeams } from '@/lib/teamService';
import { adminDb } from '@/lib/firebase-admin';
import { timestampToDate } from '@/lib/utils';

// GET /api/kras - Get user KRAs and teams
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing required parameter: userId' },
                { status: 400 }
            );
        }

        const [kras, teams] = await Promise.all([
            (async () => {
                const krasSnap = await adminDb.collection('kras').where('assignedTo', 'array-contains', userId).get();
                return krasSnap.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        dueDate: timestampToDate(data.dueDate),
                        createdAt: timestampToDate(data.createdAt),
                        updatedAt: timestampToDate(data.updatedAt)
                    };
                });
            })(),
            (async () => {
                const teamsSnap = await adminDb.collection('teams').get();
                return teamsSnap.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }));
            })()
        ]);

        return NextResponse.json({
            success: true,
            data: {
                kras,
                teams
            }
        });
    } catch (error) {
        console.error('Failed to get KRAs:', error);
        return NextResponse.json(
            { error: 'Failed to get KRAs' },
            { status: 500 }
        );
    }
}
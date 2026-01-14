import { NextRequest, NextResponse } from 'next/server';
import { deleteKRATemplate, toggleKRATemplateStatus } from '@/lib/kraAutomation';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleError } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, kraIds } = body;

        if (!action || !kraIds || !Array.isArray(kraIds)) {
            return NextResponse.json(
                { error: 'Invalid request. Required: action, kraIds (array)' },
                { status: 400 }
            );
        }

        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const kraId of kraIds) {
            try {
                switch (action) {
                    case 'delete':
                        await deleteKRATemplate(kraId);
                        success++;
                        break;

                    case 'toggleStatus':
                        // Toggle between active and inactive
                        const kraRef = doc(db, 'kraTemplates', kraId);
                        const kraSnap = await getDoc(kraRef);
                        if (kraSnap.exists()) {
                            const kraData = kraSnap.data();
                            const newActiveState = !kraData.isActive;
                            await toggleKRATemplateStatus(kraId, newActiveState);
                            success++;
                        } else {
                            throw new Error('Template not found');
                        }
                        break;

                    case 'duplicate':
                        const srcRef = doc(db, 'kraTemplates', kraId);
                        const srcSnap = await getDoc(srcRef);
                        if (srcSnap.exists()) {
                            const srcData = srcSnap.data();
                            const newTemplate = {
                                ...srcData,
                                title: `${srcData.title} (Copy)`,
                                isActive: false, // Duplicates start as inactive
                                createdAt: new Date(),
                                updatedAt: new Date(),
                                lastGenerated: null
                            };
                            delete (newTemplate as any).id;
                            await addDoc(collection(db, 'kraTemplates'), newTemplate);
                            success++;
                        } else {
                            throw new Error('Template not found');
                        }
                        break;

                    default:
                        throw new Error(`Unknown action: ${action}`);
                }
            } catch (error: any) {
                failed++;
                errors.push(`Template ${kraId}: ${error.message}`);
            }
        }

        return NextResponse.json({
            success,
            failed,
            errors
        });
    } catch (error) {
        handleError(error, 'Bulk KRA operation failed');
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

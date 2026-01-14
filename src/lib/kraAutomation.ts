// src/lib/kraAutomation.ts
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { KRA, KRAType } from '@/types';
import { timestampToDate, handleError } from './utils';

/**
 * KRA Template for automation
 */
export interface KRATemplate {
    id: string
    title: string
    description: string
    target?: string
    type: KRAType // daily, weekly, monthly
    priority: 'low' | 'medium' | 'high' | 'critical'
    assignedTo: string[] // User IDs
    teamIds?: string[]
    isActive: boolean
    lastGenerated?: Date
    createdBy: string
    createdAt: Date
    updatedAt: Date
}

/**
 * Get all active KRA templates
 */
export async function getActiveKRATemplates(): Promise<KRATemplate[]> {
    try {
        const q = query(
            collection(db, 'kraTemplates'),
            where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            lastGenerated: timestampToDate(doc.data().lastGenerated),
            createdAt: timestampToDate(doc.data().createdAt),
            updatedAt: timestampToDate(doc.data().updatedAt)
        })) as KRATemplate[];
    } catch (error) {
        handleError(error, 'Failed to fetch KRA templates');
        throw error;
    }
}

/**
 * Create a new KRA template
 */
export async function createKRATemplate(
    templateData: Omit<KRATemplate, 'id' | 'lastGenerated' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, 'kraTemplates'), {
            ...templateData,
            lastGenerated: null,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        handleError(error, 'Failed to create KRA template');
        throw error;
    }
}

/**
 * Check if KRA should be generated based on type and last generated date
 */
function shouldGenerateKRA(template: KRATemplate): boolean {
    if (!template.lastGenerated) return true;

    const now = new Date();
    const lastGen = new Date(template.lastGenerated);
    // Reset time components for accurate date comparison
    now.setHours(0, 0, 0, 0);
    lastGen.setHours(0, 0, 0, 0);

    switch (template.type) {
        case 'daily':
            // Generate if last generated was before today
            return lastGen.getTime() < now.getTime();
        case 'weekly':
            // Generate if 7+ days since last generation
            const weekDiff = Math.floor((now.getTime() - lastGen.getTime()) / (1000 * 60 * 60 * 24));
            return weekDiff >= 7;
        case 'fortnightly':
            // Generate on 1st and 16th of the month
            const day = now.getDate();
            const isFortnightStart = day === 1 || day === 16;
            // Only generate if it's the start of a fortnight AND we haven't generated today
            return isFortnightStart && lastGen.getTime() < now.getTime();
        case 'monthly':
            // Generate if different month
            return lastGen.getMonth() !== now.getMonth() || lastGen.getFullYear() !== now.getFullYear();
        default:
            return false;
    }
}

/**
 * Calculate end date based on KRA type
 */
function calculateEndDate(type: KRAType): Date {
    const now = new Date();
    switch (type) {
        case 'daily':
            return new Date(now.setHours(23, 59, 59, 999));
        case 'weekly':
            const weekEnd = new Date(now);
            weekEnd.setDate(now.getDate() + (7 - now.getDay()));
            weekEnd.setHours(23, 59, 59, 999);
            return weekEnd;
        case 'fortnightly':
            const day = now.getDate();
            if (day <= 15) {
                // First fortnight: Ends on 15th
                const end = new Date(now);
                end.setDate(15);
                end.setHours(23, 59, 59, 999);
                return end;
            } else {
                // Second fortnight: Ends on last day of month
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                end.setHours(23, 59, 59, 999);
                return end;
            }
        case 'monthly':
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            monthEnd.setHours(23, 59, 59, 999);
            return monthEnd;
        default:
            const defaultEnd = new Date(now);
            defaultEnd.setDate(now.getDate() + 7);
            return defaultEnd;
    }
}

/**
 * Generate KRAs from templates
 * @returns Number of KRAs generated
 */
export async function generateScheduledKRAs(): Promise<{ generated: number; errors: string[] }> {
    const results = { generated: 0, errors: [] as string[] };

    try {
        const templates = await getActiveKRATemplates();

        for (const template of templates) {
            if (!shouldGenerateKRA(template)) continue;

            // Check if today is a working day (skip holidays/Sundays)
            // Note: This check only applies to DAILY KRAs to prevent spam on off-days.
            // Weekly/Monthly KRAs should likely still generate or shift to next working day.
            // For now, we apply strict check for Daily, and permissive for others?
            // Actually, if a weekly KRA is generated on Monday, but Monday is a holiday, maybe better to generate on Tuesday?
            // The prompt says "Suppress Off-days".
            // Let's import the service dynamically to avoid circular deps if any (though unlikely here)
            const { isWorkingDay } = await import('./holidayService'); // Assuming generic location
            const isWorking = await isWorkingDay(new Date());

            if (!isWorking && template.type === 'daily') {
                console.log(`Skipping Daily KRA ${template.title} - Today is not a working day.`);
                continue;
            }

            try {
                // Create KRA from template
                const kraData: Omit<KRA, 'id'> = {
                    title: template.title,
                    description: template.description,
                    target: template.target,
                    type: template.type,
                    priority: template.priority,
                    assignedTo: template.assignedTo,
                    teamIds: template.teamIds,
                    createdBy: template.createdBy,
                    status: 'not_started',
                    progress: 0,
                    startDate: new Date(),
                    endDate: calculateEndDate(template.type),
                    attachments: [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await addDoc(collection(db, 'kras'), kraData);

                // Update template's lastGenerated
                const { doc, updateDoc } = await import('firebase/firestore');
                await updateDoc(doc(db, 'kraTemplates', template.id), {
                    lastGenerated: new Date(),
                    updatedAt: new Date()
                });

                results.generated++;
            } catch (error: any) {
                results.errors.push(`Template ${template.id}: ${error.message}`);
            }
        }

        return results;
    } catch (error) {
        handleError(error, 'Failed to generate scheduled KRAs');
        throw error;
    }
}

/**
 * Get all KRA templates
 */
export async function getAllKRATemplates(): Promise<KRATemplate[]> {
    try {
        const snapshot = await getDocs(collection(db, 'kraTemplates'));
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            lastGenerated: timestampToDate(doc.data().lastGenerated),
            createdAt: timestampToDate(doc.data().createdAt),
            updatedAt: timestampToDate(doc.data().updatedAt)
        })) as KRATemplate[];
    } catch (error) {
        handleError(error, 'Failed to fetch all KRA templates');
        throw error;
    }
}

/**
 * Toggle template active status
 */
export async function toggleKRATemplateStatus(templateId: string, isActive: boolean): Promise<void> {
    try {
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'kraTemplates', templateId), {
            isActive,
            updatedAt: new Date()
        });
    } catch (error) {
        handleError(error, 'Failed to toggle template status');
        throw error;
    }
}

/**
 * Delete KRA template
 */
export async function deleteKRATemplate(templateId: string): Promise<void> {
    try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'kraTemplates', templateId));
    } catch (error) {
        handleError(error, 'Failed to delete KRA template');
        throw error;
    }
}

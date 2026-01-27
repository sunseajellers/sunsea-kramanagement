// src/lib/server/kpiService.ts
import { adminDb } from '../firebase-admin';
import { KPITemplate } from '@/types';
import { createTask } from './taskService';
import { endOfDay, addDays, endOfWeek, endOfMonth } from 'date-fns';

/**
 * KPI Pulse Engine
 * Responsible for generating recurring tasks from KPI definitions.
 */

export async function processKPIPulse() {
    try {
        const now = new Date();
        const templatesSnap = await adminDb.collection('kpiTemplates')
            .where('isActive', '==', true)
            .get();

        let generatedCount = 0;

        for (const doc of templatesSnap.docs) {
            const template = doc.data() as KPITemplate;

            if (shouldGenerate(template, now)) {
                // Generate tasks for each targeted employee
                const userIds = await getTargetUserIds(template);

                for (const uid of userIds) {
                    await createTask({
                        title: template.title,
                        description: template.description,
                        priority: template.priority,
                        status: 'assigned',
                        assignedTo: [uid],
                        assignedBy: template.createdBy,
                        dueDate: calculateDueDate(template.frequency, now),
                        frequency: template.frequency,
                        category: 'KPI',
                        // Link to parent template for tracking
                        kraId: doc.id // Using kraId field as the generic 'source' id
                    });
                }

                // Update last pulse
                await doc.ref.update({
                    lastPulse: now,
                    updatedAt: now
                });

                generatedCount += userIds.length;
            }
        }

        return generatedCount;
    } catch (error) {
        console.error('KPI Pulse Error:', error);
        throw error;
    }
}

function shouldGenerate(template: KPITemplate, now: Date): boolean {
    if (!template.lastPulse) return true;

    const lastPulse = (template.lastPulse as any)?.toDate ? (template.lastPulse as any).toDate() : new Date(template.lastPulse as any);

    // Day-based comparison
    const daysSince = Math.floor((now.getTime() - lastPulse.getTime()) / (1000 * 60 * 60 * 24));

    switch (template.frequency) {
        case 'daily': return daysSince >= 1;
        case 'weekly': return daysSince >= 7;
        case 'fortnightly': return daysSince >= 14;
        case 'monthly':
            return now.getMonth() !== lastPulse.getMonth() || now.getFullYear() !== lastPulse.getFullYear();
        default: return false;
    }
}

async function getTargetUserIds(template: KPITemplate): Promise<string[]> {
    if (template.targetType === 'employee' && template.assignedTo) {
        return template.assignedTo;
    }

    if (template.targetType === 'department' && template.departmentId) {
        const usersSnap = await adminDb.collection('users')
            .where('department', '==', template.departmentId) // Or departmentId if stored
            .where('isActive', '==', true)
            .get();
        return usersSnap.docs.map(d => d.id);
    }

    return [];
}

function calculateDueDate(frequency: string, now: Date): Date {
    switch (frequency) {
        case 'daily': return endOfDay(now);
        case 'weekly': return endOfWeek(now, { weekStartsOn: 1 });
        case 'monthly': return endOfMonth(now);
        default: return addDays(now, 7);
    }
}

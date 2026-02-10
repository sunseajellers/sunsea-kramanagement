import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Ticket, KBArticle } from '@/types';
import type { Priority } from '@/types';

// Simple input type for creating tickets via smart routing
interface CreateTicketInput {
    subject: string;
    description: string;
    status: string;
    requesterId: string;
    requesterName: string;
    requesterEmail?: string;
    requestType?: string;
}

// --- Smart Routing Logic ---

const analyzeTicket = (subject: string, description: string) => {
    const text = (subject + ' ' + description).toLowerCase();
    let priority: Priority = 'low';
    let tags: string[] = [];
    let score = 0;

    // Keyword matching for priority
    if (text.includes('urgent') || text.includes('critical') || text.includes('crash') || text.includes('security')) {
        priority = 'critical';
        score += 90;
        tags.push('urgent');
    } else if (text.includes('error') || text.includes('fail') || text.includes('broken')) {
        priority = 'high';
        score += 60;
        tags.push('bug');
    } else if (text.includes('help') || text.includes('how to')) {
        priority = 'medium';
        score += 30;
        tags.push('support');
    } else {
        score += 10;
        tags.push('general');
    }

    // Auto-assignment logic (Mock)
    let assignedDepartment = 'Support';
    if (text.includes('billing') || text.includes('invoice')) {
        assignedDepartment = 'Finance';
        tags.push('finance');
    } else if (text.includes('bug') || text.includes('code')) {
        assignedDepartment = 'Engineering';
        tags.push('engineering');
    }

    return { priority, score, tags, assignedDepartment };
};

// --- Ticket Management ---

export const createTicket = async (ticketData: CreateTicketInput) => {
    try {
        const { priority, score, tags, assignedDepartment } = analyzeTicket(ticketData.subject, ticketData.description);

        const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`;

        const docRef = await addDoc(collection(db, 'tickets'), {
            ...ticketData,
            ticketNumber,
            priority,
            priorityScore: score,
            tags,
            department: assignedDepartment,
            autoAssigned: true,
            status: 'open',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating ticket:', error);
        throw error;
    }
};

export const getTickets = async (status?: string): Promise<Ticket[]> => {
    try {
        let q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));

        if (status) {
            q = query(q, where('status', '==', status));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
                resolvedAt: data.resolvedAt?.toDate()
            } as Ticket;
        });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        return [];
    }
};

// --- Knowledge Base Management ---

export const searchKB = async (queryText?: string): Promise<KBArticle[]> => {
    try {
        // Firestore doesn't support full-text search natively without extensions like Algolia.
        // For this demo, we'll fetch recent articles and filter client-side or just return all for small datasets.
        const q = query(collection(db, 'kb_articles'), orderBy('createdAt', 'desc'), where('isPublished', '==', true));
        const snapshot = await getDocs(q);

        let articles = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
            updatedAt: doc.data().updatedAt.toDate()
        })) as KBArticle[];

        if (queryText) {
            const lowerQuery = queryText.toLowerCase();
            articles = articles.filter(a =>
                a.title.toLowerCase().includes(lowerQuery) ||
                a.content.toLowerCase().includes(lowerQuery) ||
                a.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
        }

        return articles;
    } catch (error) {
        console.error('Error searching KB:', error);
        return [];
    }
};

export const createKBArticle = async (article: Omit<KBArticle, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'helpfulCount'>) => {
    try {
        await addDoc(collection(db, 'kb_articles'), {
            ...article,
            views: 0,
            helpfulCount: 0,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error('Error creating KB article:', error);
        throw error;
    }
};

// Seed some initial KB data if empty (Helper function for demo)
export const seedKB = async () => {
    const existing = await getDocs(collection(db, 'kb_articles'));
    if (existing.empty) {
        await createKBArticle({
            title: 'How to reset your password',
            content: 'Go to settings > security and click reset password.',
            category: 'Account',
            tags: ['password', 'security', 'account'],
            authorId: 'system',
            isPublished: true
        });
        await createKBArticle({
            title: 'Understanding specific commission rates',
            content: 'Commission rates are calculated based on your tier...',
            category: 'Sales',
            tags: ['finance', 'commission', 'sales'],
            authorId: 'system',
            isPublished: true
        });
    }
};

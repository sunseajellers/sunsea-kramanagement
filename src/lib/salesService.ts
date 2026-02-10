import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, Timestamp, getDoc } from 'firebase/firestore';
import { Quote, Sale } from '@/types';

// --- Quote Management ---

export const createQuote = async (quoteData: Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'quoteNumber'>) => {
    try {
        // Generate a simple quote number (in production, use a counter or transaction)
        const quoteNumber = `QT-${Date.now().toString().slice(-6)}`;

        const docRef = await addDoc(collection(db, 'quotes'), {
            ...quoteData,
            quoteNumber,
            status: 'draft',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            expiryDate: Timestamp.fromDate(quoteData.expiryDate)
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating quote:', error);
        throw error;
    }
};

export const getQuotes = async (status?: string): Promise<Quote[]> => {
    try {
        let q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));

        if (status) {
            q = query(q, where('status', '==', status));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                expiryDate: data.expiryDate.toDate(),
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate()
            } as Quote;
        });
    } catch (error) {
        console.error('Error fetching quotes:', error);
        return [];
    }
};

export const updateQuoteStatus = async (quoteId: string, status: Quote['status']) => {
    try {
        await updateDoc(doc(db, 'quotes', quoteId), {
            status,
            updatedAt: Timestamp.now()
        });
        return true;
    } catch (error) {
        console.error('Error updating quote status:', error);
        throw error;
    }
};

// --- Conversion Logic ---

export const convertQuoteToInvoice = async (quoteId: string) => {
    try {
        const quoteRef = doc(db, 'quotes', quoteId);
        const quoteSnap = await getDoc(quoteRef);

        if (!quoteSnap.exists()) {
            throw new Error('Quote not found');
        }

        const quoteData = quoteSnap.data() as Quote;

        // Create Invoice
        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
        const invoiceData = {
            invoiceNumber,
            customerId: quoteData.customerId || 'guest',
            customerName: quoteData.customerName || 'Guest Customer',
            amount: quoteData.totalAmount,
            status: 'pending',
            items: quoteData.items,
            notes: `Converted from Quote ${quoteData.quoteNumber}`,
            issuedDate: Timestamp.now(),
            dueDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // +30 days
            createdAt: Timestamp.now()
        };

        const invoiceRef = await addDoc(collection(db, 'invoices'), invoiceData);

        // Update Quote status
        await updateDoc(quoteRef, { status: 'converted', updatedAt: Timestamp.now() });

        return invoiceRef.id;
    } catch (error) {
        console.error('Error converting quote to invoice:', error);
        throw error;
    }
};

// --- Sales Management ---

export const getAllSales = async (): Promise<Sale[]> => {
    try {
        const q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as Sale));
    } catch (error) {
        console.error('Error fetching sales:', error);
        return [];
    }
};

export const PIPELINE_STAGES = [
    { id: 'lead', name: 'Leads', label: 'Leads', color: 'bg-slate-500' },
    { id: 'contacted', name: 'Contacted', label: 'Contacted', color: 'bg-blue-500' },
    { id: 'proposal', name: 'Proposal', label: 'Proposal', color: 'bg-indigo-500' },
    { id: 'negotiation', name: 'Negotiation', label: 'Negotiation', color: 'bg-amber-500' },
    { id: 'closed_won', name: 'Closed Won', label: 'Closed Won', color: 'bg-emerald-500' },
    { id: 'closed_lost', name: 'Closed Lost', label: 'Closed Lost', color: 'bg-rose-500' }
];

// --- Sales & Commission (Placeholder) ---
export const getSalesStats = async () => {
    // Mock data for now
    return {
        totalRevenue: 125000,
        pendingQuotes: 12,
        conversionRate: 24,
        averageDealSize: 5200
    };
};

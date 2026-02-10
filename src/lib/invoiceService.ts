
import { db } from './firebase';
import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';

import { query, orderBy, Timestamp } from 'firebase/firestore';

const COLLECTION_NAME = 'invoices';

import { Invoice } from '@/types';

export const getAllInvoices = async (): Promise<Invoice[]> => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('issuedDate', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : data.dueDate,
                issuedDate: data.issuedDate instanceof Timestamp ? data.issuedDate.toDate() : data.issuedDate,
            } as Invoice;
        });
    } catch (error) {
        console.error('Error getting invoices:', error);
        throw error;
    }
};

export const createInvoice = async (invoiceData: Omit<Invoice, 'id'>): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...invoiceData,
            issuedDate: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating invoice:', error);
        throw error;
    }
};

import { db } from './firebase';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { Department } from '@/types';

const COLLECTION_NAME = 'departments';

export async function getAllDepartments(): Promise<Department[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
    })) as Department[];
}

export async function createDepartment(department: Partial<Department>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...department,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateDepartment(id: string, updates: Partial<Department>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteDepartment(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
}

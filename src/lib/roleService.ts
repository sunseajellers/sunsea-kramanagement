import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { Role } from '@/types/rbac'

const ROLES_COLLECTION = 'roles'

/**
 * roleService
 * 
 * Handles CRUD operations for RBAC roles in Firestore.
 */
export const roleService = {
    // Get all roles
    async getAllRoles(): Promise<Role[]> {
        const querySnapshot = await getDocs(collection(db, ROLES_COLLECTION))
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
        } as Role))
    },

    // Get a single role by ID
    async getRoleById(id: string): Promise<Role | null> {
        const docRef = doc(db, ROLES_COLLECTION, id)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data(),
                createdAt: docSnap.data().createdAt?.toDate(),
                updatedAt: docSnap.data().updatedAt?.toDate(),
            } as Role
        }
        return null
    },

    // Create a new role
    async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, ROLES_COLLECTION), {
            ...role,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        })
        return docRef.id
    },

    // Update an existing role
    async updateRole(id: string, updates: Partial<Omit<Role, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
        const docRef = doc(db, ROLES_COLLECTION, id)
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        })
    },

    // Delete a role
    async deleteRole(id: string): Promise<void> {
        const docRef = doc(db, ROLES_COLLECTION, id)
        await deleteDoc(docRef)
    }
}

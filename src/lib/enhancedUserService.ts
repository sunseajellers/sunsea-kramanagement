import { db } from '@/lib/firebase'
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore'
import type { User, EmployeeType } from '@/types'

/**
 * Enhanced User Service
 * Handles employee management with new fields
 */
export class EnhancedUserService {
    private usersCollection = collection(db, 'users')

    /**
     * Generate unique employee ID
     * Format: EMP-0001, EMP-0002, etc.
     */
    async generateEmployeeId(): Promise<string> {
        const snapshot = await getDocs(this.usersCollection)
        const count = snapshot.size + 1
        return `EMP-${count.toString().padStart(4, '0')}`
    }

    /**
     * Create a new user with all employee fields
     */
    async createUser(data: {
        fullName: string
        email: string
        position: string
        employeeType: EmployeeType
        phone: string
        joiningDate: Date
        teamId?: string
        reportingTo?: string
        isAdmin?: boolean
        roleIds?: string[]
        dateOfBirth?: Date
        address?: string
        emergencyContact?: {
            name: string
            phone: string
            relationship: string
        }
    }): Promise<string> {
        const employeeId = await this.generateEmployeeId()

        // Get department name from team if teamId provided
        let department: string | undefined
        if (data.teamId) {
            const teamDoc = await getDoc(doc(db, 'teams', data.teamId))
            if (teamDoc.exists()) {
                department = teamDoc.data().name
            }
        }

        const userData = {
            ...data,
            employeeId,
            department,
            isActive: true,
            roleIds: data.roleIds || [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }

        const docRef = await addDoc(this.usersCollection, userData)
        return docRef.id
    }

    /**
     * Update user with new employee fields
     */
    async updateUser(userId: string, data: Partial<User>): Promise<void> {
        const docRef = doc(this.usersCollection, userId)

        // If teamId changed, update department name
        if (data.teamId) {
            const teamDoc = await getDoc(doc(db, 'teams', data.teamId))
            if (teamDoc.exists()) {
                data.department = teamDoc.data().name
            }
        }

        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        })
    }

    /**
     * Get user by ID
     */
    async getUser(userId: string): Promise<User | null> {
        const docRef = doc(this.usersCollection, userId)
        const snapshot = await getDoc(docRef)

        if (!snapshot.exists()) return null

        const data = snapshot.data()
        return {
            id: snapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            joiningDate: data.joiningDate?.toDate(),
            dateOfBirth: data.dateOfBirth?.toDate(),
            lastLogin: data.lastLogin?.toDate(),
        } as User
    }

    /**
     * Get all users
     */
    async getAllUsers(): Promise<User[]> {
        const snapshot = await getDocs(this.usersCollection)
        return snapshot.docs.map(doc => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
                joiningDate: data.joiningDate?.toDate(),
                dateOfBirth: data.dateOfBirth?.toDate(),
                lastLogin: data.lastLogin?.toDate(),
            }
        }) as User[]
    }

    /**
     * Get users by team
     */
    async getUsersByTeam(teamId: string): Promise<User[]> {
        const q = query(this.usersCollection, where('teamId', '==', teamId))
        const snapshot = await getDocs(q)

        return snapshot.docs.map(doc => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
                joiningDate: data.joiningDate?.toDate(),
                dateOfBirth: data.dateOfBirth?.toDate(),
                lastLogin: data.lastLogin?.toDate(),
            }
        }) as User[]
    }

    /**
     * Get users by employee type
     */
    async getUsersByEmployeeType(employeeType: EmployeeType): Promise<User[]> {
        const q = query(this.usersCollection, where('employeeType', '==', employeeType))
        const snapshot = await getDocs(q)

        return snapshot.docs.map(doc => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
                joiningDate: data.joiningDate?.toDate(),
                dateOfBirth: data.dateOfBirth?.toDate(),
                lastLogin: data.lastLogin?.toDate(),
            }
        }) as User[]
    }

    /**
     * Deactivate user (soft delete)
     */
    async deactivateUser(userId: string): Promise<void> {
        const docRef = doc(this.usersCollection, userId)
        await updateDoc(docRef, {
            isActive: false,
            updatedAt: serverTimestamp()
        })
    }

    /**
     * Activate user
     */
    async activateUser(userId: string): Promise<void> {
        const docRef = doc(this.usersCollection, userId)
        await updateDoc(docRef, {
            isActive: true,
            updatedAt: serverTimestamp()
        })
    }

    /**
     * Get user statistics
     */
    async getUserStats(): Promise<{
        total: number
        active: number
        inactive: number
        byType: Record<EmployeeType, number>
        byDepartment: Record<string, number>
    }> {
        const users = await this.getAllUsers()

        const stats = {
            total: users.length,
            active: users.filter(u => u.isActive).length,
            inactive: users.filter(u => !u.isActive).length,
            byType: {
                'full-time': 0,
                'part-time': 0,
                'contract': 0,
                'intern': 0
            } as Record<EmployeeType, number>,
            byDepartment: {} as Record<string, number>
        }

        users.forEach(user => {
            // Count by type
            if (user.employeeType) {
                stats.byType[user.employeeType]++
            }

            // Count by department
            if (user.department) {
                stats.byDepartment[user.department] = (stats.byDepartment[user.department] || 0) + 1
            }
        })

        return stats
    }
}

// Export singleton instance
export const enhancedUserService = new EnhancedUserService()

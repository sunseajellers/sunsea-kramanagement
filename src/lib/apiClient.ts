// API client utility for authenticated requests
import { auth } from '@/lib/firebase'

/**
 * Get Firebase ID token for authenticated requests
 */
export async function getAuthToken(): Promise<string | null> {
    try {
        if (!auth.currentUser) {
            return null
        }
        return await auth.currentUser.getIdToken()
    } catch (error) {
        console.error('Failed to get auth token:', error)
        return null
    }
}

/**
 * Make authenticated API request
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await getAuthToken()

    const headers = new Headers(options.headers)
    if (token) {
        headers.set('Authorization', `Bearer ${token}`)
    }

    return fetch(url, {
        ...options,
        headers
    })
}

/**
 * Make authenticated JSON API request
 */
export async function authenticatedJsonFetch<T = any>(
    url: string,
    options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
        const response = await authenticatedFetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        })

        const result = await response.json()

        if (!response.ok) {
            throw new Error(result.error || `HTTP ${response.status}`)
        }

        return result
    } catch (error) {
        console.error('API request failed:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}
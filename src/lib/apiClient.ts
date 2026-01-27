import { auth } from './firebase'

/**
 * Get authentication headers with the current user's token
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
    const user = auth.currentUser
    if (!user) return {}

    const token = await user.getIdToken()
    return {
        'Authorization': `Bearer ${token}`
    }
}

/**
 * Make API request (no special headers needed)
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const authHeaders = await getAuthHeaders()
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
            ...(options.headers as Record<string, string> || {})
        }
    })
}

/**
 * Make JSON API request with automatic error handling
 */
export async function authenticatedJsonFetch<T = any>(
    url: string,
    options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
        const authHeaders = await getAuthHeaders()
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
                ...(options.headers as Record<string, string> || {})
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
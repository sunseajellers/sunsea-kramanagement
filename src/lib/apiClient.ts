// API client utility - simplified (no token middleware)
// Client-side auth is handled by Firebase SDK directly
// API routes read from request params or use service calls with userId

/**
 * Make API request (no special headers needed)
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
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
        const response = await fetch(url, {
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
// Utility function for conditional class names
export function cn(...classes: (string | boolean | undefined | null)[]) {
    return classes.filter(Boolean).join(' ')
}

// Convert Firestore Timestamp to JS Date
export function timestampToDate(timestamp: any): Date {
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate()
    }
    return new Date(timestamp)
}

// Centralized error handler
export function handleError(error: any, defaultMessage: string = 'An error occurred') {
    console.error('Error:', error)
    const message = error?.message || defaultMessage
    // Import toast dynamically to avoid SSR issues
    import('react-hot-toast').then(({ default: toast }) => {
        toast.error(message)
    })
}

// Format date utilities
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

export function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export function getRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return formatDate(d)
}

// Priority utilities
export function getPriorityColor(priority: 'low' | 'medium' | 'high' | 'critical'): string {
    const colors = {
        low: 'bg-blue-100 text-blue-700 border-blue-200',
        medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        high: 'bg-orange-100 text-orange-700 border-orange-200',
        critical: 'bg-red-100 text-red-700 border-red-200'
    }
    return colors[priority]
}

export function getPriorityGradient(priority: 'low' | 'medium' | 'high' | 'critical'): string {
    const gradients = {
        low: 'from-blue-500 to-cyan-500',
        medium: 'from-yellow-500 to-orange-500',
        high: 'from-orange-500 to-red-500',
        critical: 'from-red-500 to-pink-500'
    }
    return gradients[priority]
}

// Status utilities
export function getStatusColor(status: 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'assigned'): string {
    const colors = {
        not_started: 'bg-gray-100 text-gray-700 border-gray-200',
        assigned: 'bg-blue-100 text-blue-700 border-blue-200',
        in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
        blocked: 'bg-red-100 text-red-700 border-red-200',
        completed: 'bg-green-100 text-green-700 border-green-200'
    }
    return colors[status]
}

// Calculate progress percentage
export function calculateProgress(completed: number, total: number): number {
    if (total === 0) return 0
    return Math.round((completed / total) * 100)
}

// Validate email
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

// Generate initials from name
export function getInitials(name: string): string {
    // Safety check: return default initials if name is undefined, null, or empty
    if (!name || name.trim().length === 0) {
        return 'NA'
    }
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

// Truncate text
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text
    return text.slice(0, length) + '...'
}

// Generate random color for avatars
export function getAvatarColor(name: string): string {
    const colors = [
        'from-blue-400 to-blue-600',
        'from-purple-400 to-purple-600',
        'from-pink-400 to-pink-600',
        'from-green-400 to-green-600',
        'from-yellow-400 to-yellow-600',
        'from-red-400 to-red-600',
        'from-indigo-400 to-indigo-600',
        'from-teal-400 to-teal-600'
    ]
    // Safety check: return default color if name is undefined, null, or empty
    if (!name || name.length === 0) {
        return colors[0]
    }
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
}

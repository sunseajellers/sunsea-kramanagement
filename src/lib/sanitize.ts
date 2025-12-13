import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Allows only safe HTML tags and attributes
 */
export function sanitizeHTML(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
        ALLOWED_ATTR: ['href', 'title', 'target'],
        ALLOW_DATA_ATTR: false,
    });
}

/**
 * Sanitize plain text by escaping HTML entities
 * Use this for user input that should be displayed as plain text
 */
export function sanitizeText(text: string): string {
    if (typeof text !== 'string') return '';

    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize URL to prevent javascript: and data: URIs
 */
export function sanitizeURL(url: string): string {
    if (typeof url !== 'string') return '';

    const trimmed = url.trim().toLowerCase();

    // Block dangerous protocols
    if (
        trimmed.startsWith('javascript:') ||
        trimmed.startsWith('data:') ||
        trimmed.startsWith('vbscript:') ||
        trimmed.startsWith('file:')
    ) {
        return '';
    }

    return url.trim();
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
    if (typeof filename !== 'string') return '';

    return filename
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars
        .replace(/\.{2,}/g, '.') // Remove multiple dots
        .replace(/^\.+/, '') // Remove leading dots
        .substring(0, 255); // Limit length
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
    if (typeof query !== 'string') return '';

    return query
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets
        .substring(0, 200); // Limit length
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
    if (typeof email !== 'string') return '';

    return email
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9@._+-]/g, '');
}

/**
 * Sanitize object by sanitizing all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T, sanitizer: (str: string) => string = sanitizeText): T {
    const sanitized = {} as T;

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key as keyof T] = sanitizer(value) as T[keyof T];
        } else if (Array.isArray(value)) {
            sanitized[key as keyof T] = value.map(item =>
                typeof item === 'string' ? sanitizer(item) : item
            ) as T[keyof T];
        } else if (value && typeof value === 'object') {
            sanitized[key as keyof T] = sanitizeObject(value, sanitizer) as T[keyof T];
        } else {
            sanitized[key as keyof T] = value;
        }
    }

    return sanitized;
}

/**
 * Strip all HTML tags from a string
 */
export function stripHTML(html: string): string {
    if (typeof html !== 'string') return '';

    return html.replace(/<[^>]*>/g, '');
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
    if (typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;

    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Sanitize and validate JSON string
 */
export function sanitizeJSON(jsonString: string): any | null {
    try {
        const parsed = JSON.parse(jsonString);
        // Re-stringify to remove any potential code injection
        return JSON.parse(JSON.stringify(parsed));
    } catch {
        return null;
    }
}

/**
 * Remove null bytes from string
 */
export function removeNullBytes(str: string): string {
    if (typeof str !== 'string') return '';
    return str.replace(/\0/g, '');
}

/**
 * Normalize whitespace in string
 */
export function normalizeWhitespace(str: string): string {
    if (typeof str !== 'string') return '';
    return str.replace(/\s+/g, ' ').trim();
}

/**
 * Sanitize user input for database storage
 * Combines multiple sanitization steps
 */
export function sanitizeUserInput(input: string, options: {
    allowHTML?: boolean;
    maxLength?: number;
    normalizeSpace?: boolean;
} = {}): string {
    if (typeof input !== 'string') return '';

    let sanitized = removeNullBytes(input);

    if (options.normalizeSpace) {
        sanitized = normalizeWhitespace(sanitized);
    }

    if (options.allowHTML) {
        sanitized = sanitizeHTML(sanitized);
    } else {
        sanitized = sanitizeText(sanitized);
    }

    if (options.maxLength) {
        sanitized = truncateText(sanitized, options.maxLength);
    }

    return sanitized.trim();
}

/**
 * Sanitize form data object
 */
export function sanitizeFormData(formData: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(formData)) {
        if (typeof value === 'string') {
            // Sanitize based on field name
            if (key.toLowerCase().includes('email')) {
                sanitized[key] = sanitizeEmail(value);
            } else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
                sanitized[key] = sanitizeURL(value);
            } else if (key.toLowerCase().includes('html') || key.toLowerCase().includes('description')) {
                sanitized[key] = sanitizeHTML(value);
            } else {
                sanitized[key] = sanitizeText(value);
            }
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

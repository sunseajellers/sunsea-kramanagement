import { db } from './firebase'
import {
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    where,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    increment
} from 'firebase/firestore'
import { handleError, timestampToDate } from './utils'

export interface Article {
    id: string
    title: string
    type: 'article' | 'video' | 'pdf'
    category: string
    excerpt: string
    content?: string
    url?: string
    views: number
    duration?: string
    updatedAt: Date
    createdAt: Date
    isFeatured?: boolean
}

export interface FAQ {
    id: string
    question: string
    answer: string
    category: string
    order?: number
}

const ARTICLES_COLLECTION = 'articles'
const FAQS_COLLECTION = 'faqs'

/**
 * Get all articles with optional category filter
 */
export async function getArticles(category?: string): Promise<Article[]> {
    try {
        let q = query(
            collection(db, ARTICLES_COLLECTION),
            orderBy('updatedAt', 'desc')
        )

        if (category) {
            q = query(q, where('category', '==', category))
        }

        const snap = await getDocs(q)
        return snap.docs.map(doc => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                updatedAt: timestampToDate(data.updatedAt),
                createdAt: timestampToDate(data.createdAt || data.updatedAt)
            } as Article
        })
    } catch (error) {
        handleError(error, 'Failed to fetch articles')
        return []
    }
}

/**
 * Get featured articles
 */
export async function getFeaturedArticles(limitCount = 5): Promise<Article[]> {
    try {
        // Since we might not have a composite index on isFeatured + updatedAt
        // We'll just fetch latest and filter in memory if volume is low, 
        // or query by isFeatured if index exists. 
        // For now, let's assume we want recently updated articles that are "featured"
        // or just the latest ones if no featured flag.

        // Let's just get latest for the hub
        const q = query(
            collection(db, ARTICLES_COLLECTION),
            orderBy('updatedAt', 'desc'),
            limit(limitCount)
        )

        const snap = await getDocs(q)
        return snap.docs.map(doc => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                updatedAt: timestampToDate(data.updatedAt),
                createdAt: timestampToDate(data.createdAt || data.updatedAt)
            } as Article
        })
    } catch (error) {
        handleError(error, 'Failed to fetch featured articles')
        return []
    }
}

/**
 * Increment view count for an article
 */
export async function incrementArticleView(articleId: string): Promise<void> {
    try {
        const docRef = doc(db, ARTICLES_COLLECTION, articleId)
        await updateDoc(docRef, {
            views: increment(1)
        })
    } catch (error) {
        console.error('Failed to increment view count', error)
    }
}

/**
 * Get all FAQs
 */
export async function getFAQs(): Promise<FAQ[]> {
    try {
        const q = query(
            collection(db, FAQS_COLLECTION),
            orderBy('order', 'asc')
        )
        const snap = await getDocs(q)
        return snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as FAQ))
    } catch (error) {
        handleError(error, 'Failed to fetch FAQs')
        return []
    }
}

/**
 * Seed initial data if empty (Helper for MVP)
 */
export async function seedLearningHubIfNeeded() {
    const articles = await getArticles()
    if (articles.length > 0) return

    // Seed Articles
    const seedArticles = [
        {
            title: 'Office Stationery Request Process',
            type: 'pdf',
            category: 'Admin SOPs',
            excerpt: 'Complete guide on how to request office supplies through the internal portal.',
            content: 'Full content would go here...',
            views: 1240,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            isFeatured: true
        },
        {
            title: 'Mastering the Task Dashboard',
            type: 'video',
            category: 'Learning',
            excerpt: 'Watch this 5-minute walkthrough to understand all features of your task hub.',
            duration: '5:24',
            url: 'https://example.com/video',
            views: 3500,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            isFeatured: true
        },
        {
            title: 'Internal Communication Guidelines',
            type: 'article',
            category: 'SOPs',
            excerpt: 'Standard policies for email, chat, and task-based communication standards.',
            views: 890,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            isFeatured: true
        }
    ]

    for (const art of seedArticles) {
        await addDoc(collection(db, ARTICLES_COLLECTION), art)
    }

    // Seed FAQs
    const seedFAQs = [
        { question: "How to reset password?", answer: "Go to settings...", category: "General", order: 1 },
        { question: "Leave policy basics", answer: "You get 20 days...", category: "HR", order: 2 },
        { question: "Employee benefits", answer: "Health insurance details...", category: "HR", order: 3 },
        { question: "Daily reporting guide", answer: "Submit by 5 PM...", category: "Ops", order: 4 }
    ]

    for (const faq of seedFAQs) {
        await addDoc(collection(db, FAQS_COLLECTION), faq)
    }
}

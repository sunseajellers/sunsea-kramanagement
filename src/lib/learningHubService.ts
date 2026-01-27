import { db } from './firebase';
import {
    collection,
    getDocs,
    updateDoc,
    doc,
    query,
    where,
    orderBy,
    Timestamp,
    getDoc,
    increment
} from 'firebase/firestore';
import { Article, Category, LearningHubStats } from '@/types';

const ARTICLES_COLLECTION = 'articles';
const FAQS_COLLECTION = 'faqs';
const CATEGORIES_COLLECTION = 'categories';

// ========================================
// ARTICLES
// ========================================

export async function getAllArticles(category?: string): Promise<Article[]> {
    let q = query(collection(db, ARTICLES_COLLECTION), orderBy('createdAt', 'desc'));
    if (category) {
        q = query(q, where('categoryId', '==', category));
    }
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
    })) as Article[];
}

export async function getArticleById(id: string): Promise<Article | null> {
    const docRef = doc(db, ARTICLES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    // Increment view count
    await updateDoc(docRef, { views: increment(1) });

    return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: (docSnap.data().createdAt as Timestamp)?.toDate(),
        updatedAt: (docSnap.data().updatedAt as Timestamp)?.toDate(),
    } as Article;
}

// ========================================
// CATEGORIES
// ========================================

export async function getAllCategories(): Promise<Category[]> {
    const snap = await getDocs(query(collection(db, CATEGORIES_COLLECTION), orderBy('order', 'asc')));
    return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Category[];
}

// ========================================
// STATS
// ========================================

export async function getLearningStats(): Promise<LearningHubStats> {
    const articlesSnap = await getDocs(collection(db, ARTICLES_COLLECTION));
    const faqsSnap = await getDocs(collection(db, FAQS_COLLECTION));

    let totalViews = 0;
    articlesSnap.forEach(doc => {
        totalViews += (doc.data().views || 0);
    });

    return {
        totalArticles: articlesSnap.size,
        totalFAQs: faqsSnap.size,
        totalViews: totalViews,
        mostReadArticles: articlesSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Article))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5)
    };
}

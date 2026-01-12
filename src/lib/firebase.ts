// Firebase configuration and initialization
import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { getAnalytics, Analytics } from 'firebase/analytics'

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Check if Firebase config is valid
const isFirebaseConfigured = () => {
    return !!(
        firebaseConfig.apiKey &&
        firebaseConfig.authDomain &&
        firebaseConfig.projectId &&
        firebaseConfig.storageBucket &&
        firebaseConfig.messagingSenderId &&
        firebaseConfig.appId
    )
}

// Initialize Firebase (singleton pattern)
let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: FirebaseStorage
let analytics: Analytics | null = null

// Only initialize if config is valid
if (isFirebaseConfigured()) {
    // Initialize Firebase app only once
    if (!getApps().length) {
        app = initializeApp(firebaseConfig)
    } else {
        app = getApps()[0]
    }

    // Initialize Firebase services
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)

    // Initialize Analytics only in browser environment
    if (typeof window !== 'undefined') {
        analytics = getAnalytics(app)
    }
} else {
    // Log warning in development
    if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Firebase is not configured. Please set up environment variables.')
        console.warn('Copy .env.example to .env.local and add your Firebase credentials.')
    }

    // Create mock objects to prevent errors during build
    // These will throw errors if actually used, but won't break the build
    app = {} as FirebaseApp
    auth = {} as Auth
    db = {} as Firestore
    storage = {} as FirebaseStorage
}

// Export Firebase services
export { app, auth, db, storage, analytics, isFirebaseConfigured }

// Export Firebase app for use in other files
export default app

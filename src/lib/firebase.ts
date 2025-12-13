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

// Initialize Firebase (singleton pattern)
let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: FirebaseStorage
let analytics: Analytics | null = null

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

// Export Firebase services
export { app, auth, db, storage, analytics }

// Export Firebase app for use in other files
export default app

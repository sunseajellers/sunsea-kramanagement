// Firebase Admin SDK configuration for server-side operations
import 'server-only'
import * as admin from 'firebase-admin'

// Initialize Firebase Admin SDK (singleton pattern)
let adminApp: admin.app.App

if (!admin.apps.length) {
    // Initialize with service account credentials
    // In production, use environment variables or service account key file
    const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    }

    adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
    })
} else {
    adminApp = admin.apps[0] as admin.app.App
}

// Export admin services
export const adminAuth = admin.auth(adminApp)
export const adminDb = admin.firestore(adminApp)
export const adminStorage = admin.storage(adminApp)

export default adminApp
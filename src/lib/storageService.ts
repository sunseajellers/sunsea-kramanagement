// src/lib/storageService.ts
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    listAll
} from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload a personal document for a user
 * @param userId The ID of the user
 * @param file The file object to upload
 * @param documentType Name of the document (e.g., 'aadhar', 'pan', 'other')
 * @returns The download URL of the uploaded file
 */
export async function uploadUserDocument(
    userId: string,
    file: File,
    documentType: string
): Promise<string> {
    try {
        // Create a storage reference
        // Format: users/{userId}/documents/{documentType}_{timestamp}_{filename}
        const timestamp = Date.now();
        const safeFileName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const storagePath = `users/${userId}/documents/${documentType}_${timestamp}_${safeFileName}`;
        const storageRef = ref(storage, storagePath);

        // Upload the file
        const snapshot = await uploadBytes(storageRef, file);

        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        return downloadURL;
    } catch (error) {
        console.error('Error uploading document:', error);
        throw new Error('Failed to upload document to storage');
    }
}

/**
 * Delete a user document from storage
 * @param fileUrl The full URL of the file to delete
 */
export async function deleteUserDocument(fileUrl: string): Promise<void> {
    try {
        const storageRef = ref(storage, fileUrl);
        await deleteObject(storageRef);
    } catch (error) {
        console.error('Error deleting document:', error);
        // We don't necessarily want to throw here if it's already gone
    }
}

/**
 * List all documents for a user
 * @param userId The ID of the user
 */
export async function listUserDocuments(userId: string) {
    try {
        const listRef = ref(storage, `users/${userId}/documents`);
        const res = await listAll(listRef);
        return res.items;
    } catch (error) {
        console.error('Error listing documents:', error);
        throw error;
    }
}

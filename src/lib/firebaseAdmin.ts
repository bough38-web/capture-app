import admin from 'firebase-admin';

function getFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    // Skip initialization if credentials are not real values (e.g., during build)
    if (!projectId || !clientEmail || !privateKey || privateKey.includes('YOUR_PRIVATE_KEY_HERE')) {
        throw new Error('Firebase credentials are not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env.local file.');
    }

    return admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
}

export function getDb() {
    return getFirebaseAdmin().firestore();
}

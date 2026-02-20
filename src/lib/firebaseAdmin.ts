import admin from 'firebase-admin';

function sanitizePrivateKey(rawKey: string | undefined): string {
    if (!rawKey) return '';

    let key = rawKey;

    // Remove surrounding quotes if present (in case pasted with quotes)
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
        key = key.slice(1, -1);
    }

    // Replace escaped newlines with real newlines
    key = key.replace(/\\n/g, '\n');

    return key;
}

function getFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = sanitizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (!projectId || !clientEmail || !privateKey || privateKey.includes('YOUR_PRIVATE_KEY_HERE')) {
        throw new Error(
            `Firebase credentials missing or invalid. ` +
            `projectId=${!!projectId} clientEmail=${!!clientEmail} privateKey=${!!privateKey}`
        );
    }

    try {
        return admin.initializeApp({
            credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        });
    } catch (err) {
        // Log detailed error for debugging
        console.error('Firebase Admin init error:', err);
        console.error('privateKey starts with:', privateKey?.substring(0, 40));
        throw err;
    }
}

export function getDb() {
    return getFirebaseAdmin().firestore();
}

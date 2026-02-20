import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';
import { v4 as uuidv4 } from 'uuid';

function generateLicenseKey(): string {
    const seg = () => uuidv4().replace(/-/g, '').toUpperCase().slice(0, 4);
    return `${seg()}-${seg()}-${seg()}-${seg()}`;
}

function checkAdminAuth(req: NextRequest): boolean {
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';
    return req.headers.get('x-admin-password') === adminPassword;
}

export async function GET(req: NextRequest) {
    if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const snapshot = await db.collection('licenses').orderBy('createdAt', 'desc').get();
    const licenses = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(licenses);
}

export async function POST(req: NextRequest) {
    if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { userName, email, expiresAt } = await req.json();

        if (!userName || !email) {
            return NextResponse.json({ error: 'userName and email are required' }, { status: 400 });
        }

        const db = getDb();

        // Date validation for Firestore range: 0001-01-01 to 9999-12-31
        let expiresAtDate: Date | null = null;
        if (expiresAt) {
            expiresAtDate = new Date(expiresAt);
            if (isNaN(expiresAtDate.getTime())) {
                return NextResponse.json({ error: 'Invalid expiresAt date format' }, { status: 400 });
            }
            const year = expiresAtDate.getUTCFullYear();
            if (year < 1 || year > 9999) {
                return NextResponse.json({ error: 'Date must be between year 0001 and 9999' }, { status: 400 });
            }
        }

        const newLicense = {
            key: generateLicenseKey(),
            userName,
            email,
            isActive: true,
            expiresAt: expiresAtDate,
            createdAt: new Date(),
        };

        const docRef = await db.collection('licenses').add(newLicense);
        return NextResponse.json({ id: docRef.id, ...newLicense }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating license:', error);
        return NextResponse.json({
            error: 'Failed to create license',
            details: error.message
        }, { status: 500 });
    }
}

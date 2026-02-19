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
    const { userName, email, expiresAt } = await req.json();
    if (!userName || !email) return NextResponse.json({ error: 'userName and email are required' }, { status: 400 });
    const db = getDb();
    const newLicense = {
        key: generateLicenseKey(),
        userName,
        email,
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdAt: new Date(),
    };
    const docRef = await db.collection('licenses').add(newLicense);
    return NextResponse.json({ id: docRef.id, ...newLicense }, { status: 201 });
}

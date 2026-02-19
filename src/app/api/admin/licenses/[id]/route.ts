import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

function checkAdminAuth(req: NextRequest): boolean {
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';
    return req.headers.get('x-admin-password') === adminPassword;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const db = getDb();
    await db.collection('licenses').doc(id).update(body);
    return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const db = getDb();
    await db.collection('licenses').doc(id).delete();
    return NextResponse.json({ success: true });
}

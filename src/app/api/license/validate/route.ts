import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
    try {
        const { key } = await req.json();
        if (!key) return NextResponse.json({ valid: false, reason: 'No key provided' }, { status: 400 });

        const db = getDb();
        const snapshot = await db.collection('licenses').where('key', '==', key).limit(1).get();

        if (snapshot.empty) return NextResponse.json({ valid: false, reason: '유효하지 않은 라이센스 키입니다.' });

        const data = snapshot.docs[0].data();
        if (!data.isActive) return NextResponse.json({ valid: false, reason: '비활성화된 라이센스입니다. 관리자에게 문의하세요.' });
        if (data.expiresAt && data.expiresAt.toDate() < new Date()) return NextResponse.json({ valid: false, reason: '만료된 라이센스입니다.' });

        return NextResponse.json({ valid: true, userName: data.userName });
    } catch (error) {
        console.error('License validation error:', error);
        return NextResponse.json({ valid: false, reason: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}

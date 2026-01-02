import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const documentId = searchParams.get('documentId');

        if (!documentId) {
            return NextResponse.json({ error: 'Missing documentId' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify ownership
        const doc = await db.document.findUnique({
            where: { id: documentId },
            include: { user: true }
        });

        if (!doc || doc.user.authId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const logs = await db.changeLog.findMany({
            where: { documentId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return NextResponse.json({ logs });

    } catch (error: any) {
        console.error('Fetch history failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

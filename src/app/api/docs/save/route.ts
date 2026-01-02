import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { documentId, content, saveOnly } = await request.json();

        if (!documentId || !content) {
            return NextResponse.json({ error: 'Missing documentId or content' }, { status: 400 });
        }

        // Verify ownership
        const doc = await db.document.findUnique({
            where: { id: documentId },
            include: { user: true }
        });

        if (!doc || doc.user.authId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized or document not found' }, { status: 403 });
        }

        // Update Document
        const updatedDoc = await db.document.update({
            where: { id: documentId },
            data: {
                content: content,
                updatedAt: new Date()
            }
        });

        // Create Change Log
        await db.changeLog.create({
            data: {
                documentId: documentId,
                summary: saveOnly ? 'Manual Save Loop' : 'Content Update',
            }
        });

        return NextResponse.json({ success: true, doc: updatedDoc });

    } catch (error: any) {
        console.error('Save failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

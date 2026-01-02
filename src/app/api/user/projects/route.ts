import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const dbUser = await db.user.findUnique({
            where: { authId: user.id },
        });

        if (!dbUser) {
            return NextResponse.json({ projects: [] });
        }

        // Get distinct repoNames for this user
        const distinctDocs = await db.document.findMany({
            where: {
                userId: dbUser.id,
                repoName: { not: null }
            },
            distinct: ['repoName'],
            select: {
                repoName: true,
                updatedAt: true,
                isDiscoverable: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        const projects = distinctDocs.map(doc => ({
            name: doc.repoName,
            lastUpdated: doc.updatedAt,
            isDiscoverable: doc.isDiscoverable
        }));

        return NextResponse.json({ projects });

    } catch (error: any) {
        console.error('Fetch projects failed:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch projects' }, { status: 500 });
    }
}

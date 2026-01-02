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
            return NextResponse.json({ totalProjects: 0, totalDocs: 0, totalPublished: 0, recentDocs: [] });
        }

        // 1. Total Projects (Distinct Repos)
        const distinctRepos = await db.document.findMany({
            where: { userId: dbUser.id, repoName: { not: null } },
            distinct: ['repoName'],
            select: { repoName: true }
        });
        const totalProjects = distinctRepos.length;

        // 2. Total Docs Generated
        const totalDocs = await db.document.count({
            where: { userId: dbUser.id }
        });

        // 3. Total Published
        const totalPublished = await db.document.count({
            where: { userId: dbUser.id, isPublished: true }
        });

        // 4. Recent Activity (Last 5 docs)
        const recentDocs = await db.document.findMany({
            where: { userId: dbUser.id },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                title: true,
                repoName: true,
                createdAt: true,
                isPublished: true,
                publicSlug: true
            }
        });

        // 5. Total Changes (for dashboard stats)
        const totalChanges = await db.changeLog.count({
            where: {
                document: {
                    userId: dbUser.id
                }
            }
        });

        return NextResponse.json({
            totalProjects,
            totalDocs,
            totalPublished,
            totalChanges,
            recentDocs
        });

    } catch (error: any) {
        console.error('Fetch stats failed:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch stats' }, { status: 500 });
    }
}

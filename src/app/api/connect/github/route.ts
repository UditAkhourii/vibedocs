import { NextResponse } from 'next/server';
import { GitHubConnector } from '@/lib/connectors/github';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { repoUrl, isPrivate } = await request.json();

        if (!repoUrl) {
            return NextResponse.json({ error: 'Repo URL is required' }, { status: 400 });
        }

        let token: string | undefined = undefined;

        if (isPrivate) {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            const dbUser = await db.user.findUnique({ where: { authId: user.id } });
            if (dbUser?.githubAccessToken) {
                token = dbUser.githubAccessToken;
            } else {
                return NextResponse.json({ error: 'Please connect GitHub account first' }, { status: 403 });
            }
        }

        const connector = new GitHubConnector();
        // In a real scenario, we might want to handle private repos with a token from the request
        const metadata = await connector.connect({ repoUrl, token });

        // Scan the repository to get file structure
        const tree = await connector.scan();

        // Flatten tree count for summary
        let totalFiles = 0;
        const countFiles = (nodes: any[]) => {
            for (const node of nodes) {
                totalFiles++;
                if (node.children) countFiles(node.children);
            }
        };
        countFiles(tree);

        return NextResponse.json({
            success: true,
            metadata,
            stats: {
                totalFiles,
                rootNodeCount: tree.length
            }
        });
    } catch (error: any) {
        console.error('GitHub connection failed:', error);
        return NextResponse.json({ error: error.message || 'Failed to connect to GitHub' }, { status: 500 });
    }
}

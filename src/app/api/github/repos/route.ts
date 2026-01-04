import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { Octokit } from '@octokit/rest';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get stored token
        const dbUser = await db.user.findUnique({
            where: { authId: user.id }
        });

        if (!dbUser || !dbUser.githubAccessToken) {
            return NextResponse.json({ repos: [], connected: false });
        }

        const octokit = new Octokit({ auth: dbUser.githubAccessToken });

        // Fetch user repos (public and private due to 'repo' scope)
        const { data: repos } = await octokit.repos.listForAuthenticatedUser({
            visibility: 'all',
            sort: 'updated',
            per_page: 100,
            affiliation: 'owner,collaborator,organization_member'
        });

        const formattedRepos = repos.map((repo: any) => ({
            id: repo.id,
            name: repo.full_name,
            private: repo.private,
            url: repo.html_url,
            description: repo.description,
            updatedAt: repo.updated_at
        }));

        return NextResponse.json({ repos: formattedRepos, connected: true });

    } catch (error: any) {
        console.error("Failed to fetch repos", error);
        if (error.status === 401) {
            // Token invalid or expired
            return NextResponse.json({ repos: [], connected: false, error: "Token invalid" });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

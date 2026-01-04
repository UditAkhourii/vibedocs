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
            console.log("Repos API: No user found in session");
            return new NextResponse("Unauthorized", { status: 401 });
        }

        console.log("Repos API: Checking connection for user", user.id);

        // Get stored token
        const dbUser = await db.user.findUnique({
            where: { authId: user.id }
        });

        if (!dbUser) {
            console.log("Repos API: No DB record for user", user.id);
            return NextResponse.json({ repos: [], connected: false, reason: "no_db_record" });
        }

        if (!dbUser.githubAccessToken) {
            console.log("Repos API: No token found for user", user.id);
            return NextResponse.json({ repos: [], connected: false, reason: "no_token" });
        }

        console.log("Repos API: Token found, fetching from GitHub...");
        const octokit = new Octokit({ auth: dbUser.githubAccessToken });

        // Fetch user repos (public and private due to 'repo' scope)
        const { data: repos } = await octokit.repos.listForAuthenticatedUser({
            visibility: 'all',
            sort: 'updated',
            per_page: 100,
            affiliation: 'owner,collaborator,organization_member'
        });

        console.log(`Repos API: Successfully fetched ${repos.length} repos`);

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
        console.error("Failed to fetch repos:", error.message);
        if (error.status === 401) {
            // Token invalid or expired
            return NextResponse.json({ repos: [], connected: false, error: "Token invalid", detail: error.message });
        }
        return NextResponse.json({ repos: [], connected: false, error: "Internal Error", detail: error.message }, { status: 500 });
    }
}

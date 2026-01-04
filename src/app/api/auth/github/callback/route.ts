import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

const GITHUB_CLIENT_ID = process.env.GITHUB_INTEGRATION_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_INTEGRATION_CLIENT_SECRET;

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');

    let nextUrl = '/integrations';
    try {
        if (stateParam) {
            const state = JSON.parse(decodeURIComponent(stateParam));
            if (state.next) nextUrl = state.next;
        }
    } catch (e) { /* ignore */ }

    if (!code) {
        return NextResponse.redirect(`${origin}${nextUrl}?error=no_code`);
    }

    // 1. Get current authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // If user is not logged in, we can't link. 
        // They must be logged into Supabase (email) to link this.
        return NextResponse.redirect(`${origin}/login?error=unauthorized_for_linking`);
    }

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        console.error("Missing GITHUB_INTEGRATION keys");
        return NextResponse.redirect(`${origin}${nextUrl}?error=server_config_error`);
    }

    // 2. Exchange code for token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code,
        })
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
        console.error("GitHub Token Error:", tokenData);
        return NextResponse.redirect(`${origin}${nextUrl}?error=github_token_failed`);
    }

    const accessToken = tokenData.access_token;

    // 3. Save to DB
    try {
        // Ensure user exists (Upsert)
        await db.user.upsert({
            where: { authId: user.id },
            update: { githubAccessToken: accessToken },
            create: {
                authId: user.id,
                email: user.email!, // Email is required for checking
                githubAccessToken: accessToken
            }
        });
    } catch (err) {
        console.error("Failed to save token to DB", err);
        return NextResponse.redirect(`${origin}${nextUrl}?error=db_update_failed`);
    }

    return NextResponse.redirect(`${origin}${nextUrl}?connected=true`);
}

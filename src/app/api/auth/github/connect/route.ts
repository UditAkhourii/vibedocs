import { NextResponse } from 'next/server';

const GITHUB_CLIENT_ID = process.env.GITHUB_INTEGRATION_CLIENT_ID;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: Request) {
    if (!GITHUB_CLIENT_ID) {
        console.error("Missing GITHUB_INTEGRATION_CLIENT_ID");
        return NextResponse.json({ error: 'GitHub Integration not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const next = searchParams.get('next') || '/integrations'; // Where to redirect after success

    const REDIRECT_URI = `${NEXT_PUBLIC_APP_URL}/api/auth/github/callback`;
    const scope = 'repo';

    // Encode the 'next' path in the state or just rely on a default?
    // We can pass state, but for simplicity let's stick to config.
    // Actually, we can use 'state' to store the 'next' URL to redirect back properly.
    const state = encodeURIComponent(JSON.stringify({ next }));

    const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope,
        state
    });

    return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`);
}

"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

export function AuthListener() {
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        // If we have an auth code but aren't on the callback route (which is an API route anyway),
        // it means we landed on a page with the code. Redirect to the server-side callback handler.
        if (code) {
            const next = params.get('next') || window.location.pathname;
            window.location.href = `/auth/callback?code=${code}&next=${next}`;
            return;
        }

        // Handle confetti on verification
        if (params.get('verified') === 'true') {
            import('canvas-confetti').then((confetti) => {
                confetti.default({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#6366f1', '#a855f7', '#ec4899']
                });
            });

            // Clean URL without refreshing
            const url = new URL(window.location.href);
            url.searchParams.delete('verified');
            window.history.replaceState({}, '', url);
        }

        // Listen for auth changes (cross-tab sync)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth Event:", event);
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                // Trigger welcome email sequence for new users (idempotent on server)
                // Save provider token ONLY if this is a GitHub login
                // This prevents Google/Slack tokens from overwriting GitHub integration tokens
                if (event === 'SIGNED_IN' && session?.user && session.provider_token) {
                    const provider = session.user.app_metadata?.provider;

                    if (provider === 'github') {
                        try {
                            fetch('/api/user/token', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ token: session.provider_token })
                            });
                        } catch (e) {
                            console.error("Failed to save provider token", e);
                        }
                    }

                    try {
                        fetch('/api/auth/welcome', { method: 'POST' });
                    } catch (e) {
                        console.error("Failed to trigger welcome email", e);
                    }
                }

                // If the user was just verified or signed in in another tab
                // refresh the current page to update all RSCs and states
                router.refresh();
            }
        });

        return () => subscription.unsubscribe();
    }, [pathname, router, supabase.auth]);

    return null;
}

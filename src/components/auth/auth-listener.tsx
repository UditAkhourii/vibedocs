"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

export function AuthListener() {
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Handle confetti on verification
        const params = new URLSearchParams(window.location.search);
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
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth Event:", event);
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                // If the user was just verified or signed in in another tab
                // refresh the current page to update all RSCs and states
                router.refresh();
            }
        });

        return () => subscription.unsubscribe();
    }, [pathname, router, supabase.auth]);

    return null;
}

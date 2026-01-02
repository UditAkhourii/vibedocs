"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

export function VerificationBanner() {
    const [user, setUser] = useState<User | null>(null);
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error' | 'cooldown'>('idle');
    const [cooldown, setCooldown] = useState(0);
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            // Check if email is confirmed. 
            // Note: user.email_confirmed_at is set if confirmed.
            // If unconfirmed, we show the banner.
            if (user && !user.email_confirmed_at) {
                setUser(user);
            } else {
                setUser(null);
            }
        };

        checkUser();

        // Listen for auth changes to hide banner if they verify in another tab or log out
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user && !session.user.email_confirmed_at) {
                setUser(session.user);
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (status === 'cooldown' && cooldown > 0) {
            timer = setInterval(() => {
                setCooldown(prev => {
                    if (prev <= 1) {
                        setStatus('idle');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [status, cooldown]);

    const handleResend = async () => {
        if (!user?.email) return;
        setStatus('sending');
        try {
            // Supabase client-side resend
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: user.email,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`
                }
            });

            if (error) {
                // Determine if it's a "User already registered" or rate limit error
                throw error;
            }

            setStatus('sent');
            setCooldown(60);
            setTimeout(() => setStatus('cooldown'), 2000); // Show "Sent" briefly then cooldown
        } catch (error) {
            console.error('Resend error:', error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    if (!user) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-yellow-500/10 border-b border-yellow-500/20 backdrop-blur-sm"
            >
                <div className="container flex items-center justify-between py-2 px-4 text-sm text-yellow-200/90">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span>Please verify your email address <strong>{user.email}</strong> to unlock full features. (Check your spam folder if it&apos;s missing.)</span>
                    </div>

                    <button
                        onClick={handleResend}
                        disabled={status !== 'idle' && status !== 'error'}
                        className="flex items-center gap-2 px-3 py-1 rounded-md bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status === 'sending' && <Loader2 className="h-3 w-3 animate-spin" />}
                        {status === 'sent' && <CheckCircle2 className="h-3 w-3" />}
                        {status === 'idle' && "Resend Verification"}
                        {status === 'sending' && "Sending..."}
                        {status === 'sent' && "Sent!"}
                        {status === 'error' && "Failed, try again"}
                        {status === 'cooldown' && `Resend in ${cooldown}s`}
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

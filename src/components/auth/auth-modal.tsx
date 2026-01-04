"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Mail, Lock, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultView?: "signin" | "signup";
}

export function AuthModal({ isOpen, onClose, defaultView = "signin" }: AuthModalProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isSignUp, setIsSignUp] = useState(defaultView === "signup");
    const [isResetMode, setIsResetMode] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Sync internal state with prop when modal opens/prop changes
    useEffect(() => {
        setIsSignUp(defaultView === "signup");
        setIsResetMode(false);
        setMessage(null); // Clear previous messages on view flip
    }, [defaultView, isOpen]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (isResetMode) {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${location.origin}/auth/callback?next=/update-password`,
                });
                if (error) throw error;
                setMessage({ type: "success", text: "Password reset link sent to your email!" });
            } else if (isSignUp) {
                // Sign up the user
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${location.origin}/auth/callback`,
                    },
                });
                if (error) throw error;

                // Close modal and redirect to home immediately
                onClose();
                router.push('/');
                router.refresh();
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onClose();
                router.push('/');
                router.refresh();
            }
        } catch (error: any) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleGithubLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                    scopes: 'repo',
                },
            });
            if (error) throw error;
        } catch (error: any) {
            setMessage({ type: "error", text: error.message });
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (error: any) {
            setMessage({ type: "error", text: error.message });
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl text-white">
                        {isResetMode ? "Reset Password" : (isSignUp ? "Create an account" : "Welcome back")}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    {!isResetMode && (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleGithubLogin}
                                    disabled={loading}
                                    className="bg-white text-black hover:bg-zinc-200 border-white/10"
                                >
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Github className="mr-2 h-4 w-4" />}
                                    GitHub
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="bg-zinc-800 text-white hover:bg-zinc-700 border-white/10"
                                >
                                    {loading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                        </svg>
                                    )}
                                    Google
                                </Button>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/10" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-zinc-900 px-2 text-zinc-400">Or continue with</span>
                                </div>
                            </div>
                        </>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-400">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-10 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {!isResetMode && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-400">
                                        Password
                                    </label>
                                    {!isSignUp && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsResetMode(true);
                                                setMessage(null);
                                            }}
                                            className="text-xs text-indigo-400 hover:text-indigo-300"
                                        >
                                            Forgot password?
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-10 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {message && (
                            <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                {message.text}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isResetMode ? "Send Reset Link" : (isSignUp ? "Sign Up" : "Sign In")}
                        </Button>
                    </form>

                    <div className="text-center text-sm">
                        {isResetMode ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsResetMode(false);
                                    setMessage(null);
                                }}
                                className="text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                Back to Sign In
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setMessage(null);
                                }}
                                className="text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                            </button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

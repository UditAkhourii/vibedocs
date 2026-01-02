"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Github, CheckCircle2, AlertCircle, Sparkles, LogOut, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { InteractiveGrid } from "@/components/ui/interactive-grid";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewDocPage() {
    const router = useRouter();
    const [isConnecting, setIsConnecting] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoadingUser(false);
        }
        getUser();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        router.refresh();
    };

    const handleSubmitGithub = async (url: string) => {
        if (!url) return;

        if (!user) {
            router.push("/login");
            return;
        }

        let finalUrl = url.trim();
        if (finalUrl.startsWith('[') && finalUrl.endsWith(']')) {
            finalUrl = finalUrl.split(': ').pop()?.replace(']', '') || finalUrl;
        }

        setIsConnecting(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const res = await fetch('/api/connect/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repoUrl: finalUrl })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to connect');

            setAnalysisResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center p-6 overflow-hidden bg-[#0A0A0B]">
            {/* Auth Button */}
            <div className="absolute top-6 right-6 z-50">
                {!loadingUser && (
                    user ? (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                                <UserIcon className="w-3 h-3" />
                                <span className="max-w-[100px] truncate">{user.email}</span>
                            </div>
                        </div>
                    ) : (
                        <Link href="/login">
                            <Button variant="outline" className="border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white">
                                Sign In
                            </Button>
                        </Link>
                    )
                )}
            </div>

            <InteractiveGrid />

            <div className="z-10 w-full max-w-4xl flex flex-col items-center gap-10 text-center">
                {/* Logo/Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/5 backdrop-blur-sm text-[10px] uppercase tracking-[0.2em] font-medium text-white/40"
                >
                    <Sparkles className="w-3 h-3 text-white/30" />
                    Create New Documentation
                </motion.div>

                {/* Title Section */}
                <div className="space-y-4">
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="text-5xl md:text-6xl font-medium tracking-tight text-white/90"
                    >
                        Generate Docs in Minutes
                    </motion.h1>
                </div>

                {/* Interaction Area */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-lg"
                >
                    <AnimatePresence mode="wait">
                        {!analysisResult ? (
                            <motion.div key="input" exit={{ opacity: 0, scale: 0.98 }}>
                                <PromptInputBox
                                    onSend={(message) => handleSubmitGithub(message)}
                                    isLoading={isConnecting}
                                    placeholder="Paste repository URL (e.g. facebook/react)"
                                />
                                <div className="mt-4 flex items-center justify-center gap-6 opacity-30">
                                    <div className="flex items-center gap-2 text-xs font-light text-white">
                                        <Github className="w-3 h-3" />
                                        <span>Public Repos</span>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col gap-6 rounded-3xl bg-[#141416] p-8 border border-white/5 shadow-2xl text-left"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                            <CheckCircle2 className="w-5 h-5 text-white/80" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-white/90">Repository Connected</h3>
                                            <p className="text-xs text-white/30">Ready to architect documentation</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Framework</p>
                                        <p className="text-sm font-medium text-white/80">{analysisResult.metadata.framework || 'Detected'}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Files</p>
                                        <p className="text-sm font-medium text-white/80">{analysisResult.stats.totalFiles}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-11 rounded-xl border-white/10 bg-transparent text-white/60 hover:bg-white/5 hover:text-white"
                                        onClick={() => setAnalysisResult(null)}
                                    >
                                        Rescan
                                    </Button>
                                    <Button
                                        className="flex-1 h-11 rounded-xl bg-white text-black hover:bg-white/90"
                                        onClick={() => window.location.href = `/docs?repo=${analysisResult.metadata.id}`}
                                    >
                                        View Docs
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400/80 text-sm flex items-center gap-3"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

"use client";

import { Blocks, CheckCircle2, CircleDashed, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export default function IntegrationsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [isGithubConnected, setIsGithubConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function checkConnection() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Check if github is in identities
                const isConnected = user.app_metadata.provider === 'github' ||
                    user.identities?.some(id => id.provider === 'github');
                setIsGithubConnected(!!isConnected);
            }
            setLoading(false);
        }
        checkConnection();
    }, []);

    const handleConnectGithub = async () => {
        try {
            if (user) {
                const { error } = await supabase.auth.linkIdentity({
                    provider: 'github',
                    options: {
                        redirectTo: `${window.location.origin}/integrations`,
                        scopes: 'repo',
                    },
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'github',
                    options: {
                        redirectTo: `${window.location.origin}/integrations`,
                        scopes: 'repo',
                    },
                });
                if (error) throw error;
            }
        } catch (error) {
            console.error("Error connecting GitHub:", error);
            // Optionally set error state here if UI has error display
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
                    <p className="text-zinc-400 mt-2">Connect SuperDocs with your favorite tools.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* GitHub */}
                    <div className={`rounded-xl border ${isGithubConnected ? 'border-indigo-500/20 bg-indigo-500/5' : 'border-white/5 bg-zinc-900/30'} p-6 relative overflow-hidden transition-all`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${isGithubConnected ? 'bg-white/10' : 'bg-zinc-800'}`}>
                                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                            </div>
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                            ) : isGithubConnected ? (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Connected
                                </div>
                            ) : (
                                <button
                                    onClick={handleConnectGithub}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black hover:bg-zinc-200 text-xs font-medium transition-colors"
                                >
                                    Connect
                                </button>
                            )}
                        </div>
                        <h3 className="text-lg font-semibold mb-1">GitHub</h3>
                        <p className="text-sm text-zinc-400">Import repositories and auto-sync documentation.</p>
                    </div>

                    {/* Slack - Coming Soon */}
                    <div className="rounded-xl border border-white/5 bg-zinc-900/30 p-6 relative overflow-hidden opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-[#4A154B]/20 flex items-center justify-center text-[#E01E5A]">
                                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.52v-3.794h-2.52zm8.834 5.71a2.528 2.528 0 0 1 0-2.521c1.393 0 2.52.1128 2.52.252v2.521a2.528 2.528 0 0 1-2.52 2.52h-2.52zm0-1.27c0-1.393.1128-2.522.252-2.522h6.313A2.528 2.528 0 0 1 24 15.165a2.528 2.528 0 0 1-2.521 2.522h-3.794v2.52a2.528 2.528 0 0 1-2.522 2.522M18.958 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.521 2.521h-2.521V8.834zm-1.27-6.313a2.528 2.528 0 0 1-2.52-2.521 2.528 2.528 0 0 1 2.52-2.52h-2.52v-2.521a2.528 2.528 0 0 1 2.52-2.521zm-6.313 1.25a2.528 2.528 0 0 1 0 2.521 2.527 2.527 0 0 1-2.522 2.521h-2.52V6.313A2.528 2.528 0 0 1 8.834 3.794a2.527 2.527 0 0 1 2.521-2.521h2.521v-2.52zm-3.794 2.522a2.527 2.527 0 0 1 2.52-2.522 2.527 2.527 0 0 1 2.521 2.522v3.794h3.794a2.527 2.527 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521h-6.313z" />
                                </svg>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs font-medium border border-zinc-700">
                                <CircleDashed className="w-3.5 h-3.5" />
                                Soon
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold mb-1">Slack</h3>
                        <p className="text-sm text-zinc-500">Get notifications when documentation is updated.</p>
                    </div>

                    {/* Vercel - Coming Soon */}
                    <div className="rounded-xl border border-white/5 bg-zinc-900/30 p-6 relative overflow-hidden opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-white border border-white/10">
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 22.525H0l12-21.05 12 21.05z" />
                                </svg>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs font-medium border border-zinc-700">
                                <CircleDashed className="w-3.5 h-3.5" />
                                Soon
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold mb-1">Vercel</h3>
                        <p className="text-sm text-zinc-500">Deploy your documentation site automatically.</p>
                    </div>

                </div>
            </div>
        </div>
    );
}

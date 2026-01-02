"use client";

import { createClient } from "@/lib/supabase/client";
import { LogOut, User, Mail, Shield, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ApiKeyManager } from "@/components/settings/api-key-manager";

export default function SettingsPage() {
    const supabase = createClient();
    const router = useRouter();
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email || null);
            }
        }
        getUser();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-zinc-400 mt-2">Manage your account preferences and session.</p>
                </div>

                <div className="space-y-6">
                    {/* Account Section */}
                    <div className="rounded-xl border border-white/10 bg-zinc-900/30 overflow-hidden">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <User className="w-5 h-5 text-indigo-400" />
                                Account
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-500 mb-1">Email Address</label>
                                <div className="flex items-center gap-2 text-white bg-zinc-950/50 p-3 rounded-lg border border-white/5">
                                    <Mail className="w-4 h-4 text-zinc-500" />
                                    <span>{userEmail || "Loading..."}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* API Keys Section */}
                    <div className="rounded-xl border border-white/10 bg-zinc-900/30 overflow-hidden">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Shield className="w-5 h-5 text-indigo-400" />
                                Access Tokens
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <ApiKeyManager />
                        </div>
                    </div>

                    {/* Appearance (Placeholder) */}
                    <div className="rounded-xl border border-white/10 bg-zinc-900/30 overflow-hidden opacity-75">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Moon className="w-5 h-5 text-indigo-400" />
                                Appearance
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Theme Preference</p>
                                    <p className="text-xs text-zinc-500">Switch between light and dark mode.</p>
                                </div>
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>

                    {/* Sign Out */}
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 font-medium hover:bg-red-500/20 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}

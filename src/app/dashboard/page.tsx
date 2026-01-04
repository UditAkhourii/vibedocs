"use client";

import { useEffect, useState } from "react";
import {
    LayoutDashboard,
    FileText,
    Globe,
    FolderGit,
    Plus,
    ArrowRight,
    Loader2,
    Clock,
    CheckCircle2,
    Sparkles
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUser(user);

            try {
                const res = await fetch('/api/user/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (e) {
                console.error("Failed to load stats", e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [router, supabase]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white overflow-y-auto">
            <div className="p-6 md:p-10">
                <div className="max-w-5xl mx-auto space-y-10">

                    {/* Header */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight mb-2">
                                Welcome back, {user?.email?.split('@')[0]}
                            </h1>
                            <p className="text-zinc-400">
                                Manage your documentation projects and track performance.
                            </p>
                        </div>
                        <Link href="/">
                            <button className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-medium hover:bg-zinc-200 transition-all shadow-lg shadow-white/5">
                                <Plus className="w-4 h-4" />
                                Create New Doc
                            </button>
                        </Link>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatsCard
                            title="Active Projects"
                            value={stats?.totalProjects || 0}
                            icon={<FolderGit className="w-5 h-5 text-indigo-400" />}
                        />
                        <StatsCard
                            title="Pages Generated"
                            value={stats?.totalDocs || 0}
                            icon={<FileText className="w-5 h-5 text-purple-400" />}
                        />
                        <StatsCard
                            title="Published Live"
                            value={stats?.totalPublished || 0}
                            icon={<Globe className="w-5 h-5 text-green-400" />}
                        />
                        <StatsCard
                            title="Total Edits"
                            value={stats?.totalChanges || 0}
                            icon={<Sparkles className="w-5 h-5 text-amber-400" />}
                        />
                    </div>

                    {/* Main Content Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Recent Activity */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-zinc-500" />
                                    Recent Activity
                                </h2>
                                <Link href="/documents" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                    View All <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>

                            <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-1 overflow-hidden">
                                {stats?.recentDocs?.length > 0 ? (
                                    <div className="space-y-1">
                                        {stats.recentDocs.map((doc: any) => (
                                            <div key={doc.id} className="group flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center border border-white/5 group-hover:border-indigo-500/20 group-hover:bg-indigo-500/10 transition-colors">
                                                        <FileText className="w-5 h-5 text-zinc-500 group-hover:text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium text-white group-hover:text-indigo-200 transition-colors truncate max-w-[200px] md:max-w-xs">
                                                            {doc.title}
                                                        </h3>
                                                        <p className="text-xs text-zinc-500 flex items-center gap-2">
                                                            {doc.repoName} • {formatDistanceToNow(new Date(doc.createdAt))} ago
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {doc.isPublished ? (
                                                        <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-medium border border-green-500/20">
                                                            Live
                                                        </span>
                                                    ) : (
                                                        <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-500 text-[10px] font-medium border border-white/5">
                                                            Draft
                                                        </span>
                                                    )}
                                                    <Link href={`/docs?repo=${encodeURIComponent(doc.repoName)}`}>
                                                        <button className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                                                            <ArrowRight className="w-4 h-4" />
                                                        </button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-zinc-500">
                                        <p>No recent activity. Start creating!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Access / Tips */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <LayoutDashboard className="w-5 h-5 text-zinc-500" />
                                Quick Actions
                            </h2>

                            <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-5 space-y-4">
                                <Link href="/" className="block">
                                    <div className="group p-4 rounded-xl border border-dashed border-zinc-700 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-center cursor-pointer">
                                        <div className="w-10 h-10 mx-auto bg-indigo-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Plus className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <h3 className="font-medium text-white mb-1">New Documentation</h3>
                                        <p className="text-xs text-zinc-500">From GitHub URL</p>
                                    </div>
                                </Link>

                                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-white/5">
                                    <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                        Pro Tip
                                    </h3>
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        Publish your docs to get a shareable public link. It's great for showing off your work or sharing with your team!
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon, trend }: any) {
    return (
        <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm hover:bg-zinc-900/60 transition-colors">
            <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center border border-white/5">
                    {icon}
                </div>
                {/* <span className="text-xs font-medium text-zinc-500 bg-white/5 px-2 py-1 rounded">
                    {trend}
                </span> */}
            </div>
            <div>
                <p className="text-sm text-zinc-400 font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
            </div>
        </div>
    )
}

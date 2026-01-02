"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Book, Sparkles, Terminal, Globe, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Doc {
    id: string;
    publicSlug: string;
    repoName: string;
    title: string | null;
    updatedAt: string;
    description?: string;
}

export function FeaturedDocs() {
    const [docs, setDocs] = useState<Doc[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFeatured() {
            try {
                const res = await fetch('/api/featured');
                if (res.ok) {
                    const data = await res.json();
                    setDocs(data);
                }
            } catch (error) {
                console.error("Failed to fetch featured docs", error);
            } finally {
                setLoading(false);
            }
        }

        fetchFeatured();
    }, []);

    if (loading) {
        return (
            <div className="w-full max-w-7xl mx-auto mt-32 px-6">
                <div className="flex items-center gap-2 mb-8 opacity-50">
                    <div className="h-4 w-4 rounded-full bg-white/20 animate-pulse" />
                    <div className="h-4 w-32 rounded bg-white/20 animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-[240px] rounded-3xl bg-white/5 animate-pulse border border-white/5" />
                    ))}
                </div>
            </div>
        );
    }

    if (docs.length === 0) return null;

    return (
        <section className="w-full max-w-[1400px] mx-auto mt-10 px-6 pb-20">
            <div className="flex flex-col items-center text-center gap-6 mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-3 flex flex-col items-center"
                >
                    <div className="flex items-center gap-2 text-indigo-400 font-medium tracking-wide text-xs uppercase">
                        <Sparkles className="w-3 h-3" />
                        <span>Community Favorites</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-medium text-white/90 tracking-tight">
                        Featured Documentation
                    </h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                >
                    <Link
                        href="/explore"
                        className="group flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium text-white/80"
                    >
                        View All
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {docs.map((doc, index) => (
                    <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Link
                            href={`/p/${doc.publicSlug}`}
                            className="group relative flex flex-col justify-between h-[260px] p-5 rounded-3xl bg-[#141416] border border-white/5 hover:border-indigo-500/20 transition-all duration-500 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Content */}
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300 group-hover:scale-105 transition-all">
                                        <Book className="w-5 h-5" />
                                    </div>
                                    <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-medium text-zinc-400">
                                        doc
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-white/90 group-hover:text-white leading-tight truncate">
                                        {doc.repoName}
                                    </h3>
                                    <p className="text-sm text-zinc-500 line-clamp-3 font-light leading-relaxed">
                                        {doc.title || `Documentation for ${doc.repoName}`}
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="relative z-10 pt-4 mt-auto border-t border-dashed border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                                    <Calendar className="w-3 h-3" />
                                    <span>Updated {formatDistanceToNow(new Date(doc.updatedAt))} ago</span>
                                </div>
                                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-white group-hover:text-black transition-all">
                                    <ArrowRight className="w-3 h-3 -ml-px" />
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

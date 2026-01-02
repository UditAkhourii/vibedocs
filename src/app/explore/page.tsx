
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowRight, Book, Calendar, Github, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
    // Fetch all published documents
    // We group by repoName to show distinct "Projects"
    const publishedDocs = await db.document.findMany({
        where: {
            isPublished: true,
        },
        orderBy: {
            updatedAt: 'desc'
        },
        distinct: ['repoName'] // Show unique repos
    });

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-white p-8 md:p-12 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-400 mb-2">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-sm font-medium uppercase tracking-wider">Community Showcase</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white/90">
                        Explore Documentation
                    </h1>
                    <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
                        Discover comprehensive documentation for libraries, tools, and projects built by the community.
                        Powered by SuperDocs AI.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {publishedDocs.map((doc) => (
                        <Link
                            key={doc.id}
                            href={`/p/${doc.publicSlug}`}
                            className="group relative flex flex-col justify-between h-[280px] p-6 rounded-3xl bg-[#141416] border border-white/5 hover:border-indigo-500/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] overflow-hidden"
                        >
                            {/* Hover Gradient Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10 space-y-6">
                                {/* Repo Icon / Initial */}
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                    <Book className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-white/90 group-hover:text-white mb-2 truncate">
                                        {doc.repoName}
                                    </h3>
                                    <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">
                                        {doc.title}
                                    </p>
                                </div>
                            </div>

                            <div className="relative z-10 flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
                                <div className="flex items-center gap-2 text-xs text-zinc-600">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{formatDistanceToNow(new Date(doc.updatedAt))} ago</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-indigo-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                    Read Docs <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* Empty State */}
                    {publishedDocs.length === 0 && (
                        <div className="col-span-full py-20 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                                <Book className="w-8 h-8 text-white/20" />
                            </div>
                            <h3 className="text-xl font-medium text-white/80">No published docs yet</h3>
                            <p className="text-zinc-500">Be the first to publish your documentation!</p>
                            <Link href="/">
                                <button className="mt-6 px-6 py-2.5 rounded-full bg-white text-black font-medium hover:bg-zinc-200 transition-colors">
                                    Create Documentation
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

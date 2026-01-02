"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import confetti from "canvas-confetti";
import {
    Menu, Home, ChevronRight, Loader2, AlertCircle,
    Search, Book, Sparkles, Command, FileText, CheckCircle2,
    Edit2, Save, Globe, History, ArrowLeft, ArrowRight, RefreshCw, Eye
} from "lucide-react";

// ... (lines 13-408 skipped for brevity in replacement, but I must match exact target content for safe replacement, or use broader context)
// Since I can't skip lines in replacement content easily without matching, I will do two edits or one large block.
// Let's do imports first, then header.


type DocPage = {
    id: string;
    title: string;
    category: string;
    description: string;
    content?: string | null;
    isGenerating?: boolean;
    documentId?: string;
    publicSlug?: string;
    isPublished?: boolean;
};

type ChangeLog = {
    id: string;
    summary: string;
    createdAt: string;
};

export default function DocsPage() {
    const searchParams = useSearchParams();
    const repoName = searchParams.get("repo");

    const [activePage, setActivePage] = useState<string>("intro");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [docPages, setDocPages] = useState<DocPage[]>([]);
    const [isLoadingPlan, setIsLoadingPlan] = useState(true);
    const [planContext, setPlanContext] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("Initializing connection...");
    const [generatedCount, setGeneratedCount] = useState(0);

    // Editor & History States
    const [isEditing, setIsEditing] = useState(false);
    const [editorContent, setEditorContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [historyLogs, setHistoryLogs] = useState<ChangeLog[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // 1. Initial Plan Generation
    useEffect(() => {
        if (!repoName) {
            setIsLoadingPlan(false);
            return;
        }

        const mode = searchParams.get("mode"); // 'new' or null
        let progressInterval: NodeJS.Timeout;

        const generatePlan = async () => {
            progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev < 30) { setStatusMessage("Connecting to GitHub tree..."); return prev + 2; }
                    if (prev < 60) { setStatusMessage("Performing Deep Scan of source code..."); return prev + 1; }
                    if (prev < 90) { setStatusMessage("Architecting Documentation Structure..."); return prev + 0.5; }
                    return prev;
                });
            }, 200);

            try {
                const targetUrl = repoName.includes("github.com") ? repoName : `https://github.com/${repoName}`;

                const res = await fetch('/api/docs/plan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        repoUrl: targetUrl,
                        intent: mode === 'new' ? 'new' : 'open'
                    })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to generate plan");

                // Correctly handle content: existing content > null (for draft)
                setDocPages(data.docs.map((d: any) => ({
                    ...d,
                    // If backend sends empty string for content, treat as null for draft unless explicitly empty
                    content: d.content && d.content.length > 0 ? d.content : null
                })));
                setPlanContext(data.context);

                if (data.docs.length > 0) setActivePage(data.docs[0].id);

                setProgress(100);
                setStatusMessage("Structure Ready. Writing Content...");
                setIsLoadingPlan(false);

            } catch (err: any) {
                setError(err.message);
                setIsLoadingPlan(false);
            } finally {
                clearInterval(progressInterval);
            }
        };

        generatePlan(); // Actually call it

        return () => clearInterval(progressInterval);
    }, [repoName, searchParams]);

    // 2. Content Generation Queue
    useEffect(() => {
        if (isLoadingPlan || !planContext || docPages.length === 0) return;

        const generateNextPage = async () => {
            const pageIndex = docPages.findIndex(p => !p.content && !p.isGenerating);
            if (pageIndex === -1) return;

            const page = docPages[pageIndex];

            setDocPages(prev => prev.map((p, i) => i === pageIndex ? { ...p, isGenerating: true } : p));

            try {
                const res = await fetch('/api/docs/content', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pageTitle: page.title,
                        sectionDescription: page.description,
                        deepContext: planContext.substring(0, 50000), // Truncate to avoid payload limits
                        repoName: repoName
                    })
                });

                const data = await res.json();
                const content = data.success ? data.content : `> **Error generating content**\n>\n> *Server response:* ${data.error || 'Unknown error'}`;
                const documentId = data.documentId;

                setDocPages(prev => prev.map((p, i) => i === pageIndex ? { ...p, isGenerating: false, content, documentId } : p));
                setGeneratedCount(prev => prev + 1);

            } catch (e) {
                console.error("Content gen error", e);
                setDocPages(prev => prev.map((p, i) => i === pageIndex ? { ...p, isGenerating: false, content: "> Failed to load." } : p));
            }
        };

        generateNextPage();

    }, [docPages, isLoadingPlan, planContext, repoName, generatedCount]);

    const currentPage = docPages.find(p => p.id === activePage);

    // Sync editor content when page changes or content loads
    useEffect(() => {
        if (currentPage?.content) {
            setEditorContent(currentPage.content);
        } else {
            setEditorContent("");
        }
    }, [currentPage, currentPage?.content]);

    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const handleRegenerate = async () => {
        if (!currentPage) return;
        setIsRegenerating(true);
        try {
            const res = await fetch('/api/docs/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pageTitle: currentPage.title,
                    sectionDescription: currentPage.description,
                    deepContext: planContext.substring(0, 50000),
                    repoName: repoName
                })
            });

            const data = await res.json();
            const content = data.success ? data.content : `> **Error generating content**\n>\n> *Server response:* ${data.error || 'Unknown error'}`;
            const documentId = data.documentId;

            setDocPages(prev => prev.map(p => p.id === activePage ? { ...p, content, documentId } : p));
            setEditorContent(content);
        } catch (e) {
            console.error(e);
            alert("Regeneration failed");
        } finally {
            setIsRegenerating(false);
        }
    };

    const handlePublish = async () => {
        if (!currentPage?.documentId) return;
        setIsPublishing(true);

        try {
            // Construct category map to sync DB
            const categoriesMap = docPages.reduce((acc, page) => {
                if (page.category) acc[page.id] = page.category;
                return acc;
            }, {} as Record<string, string>);

            // Haptic/Visual feedback handled by UI state
            const res = await fetch('/api/docs/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentId: currentPage.documentId,
                    repoName: repoName, // Publish entire project
                    categories: categoriesMap
                })
            });
            const data = await res.json();

            if (data.success) {
                // Mark ALL pages as published
                setDocPages(prev => prev.map(p => ({ ...p, isPublished: true, publicSlug: p.id === activePage ? data.slug : p.publicSlug })));

                // Celebration
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });

                // Short delay before redirect
                setTimeout(() => {
                    window.open(data.publicUrl, '_blank');
                    setIsPublishing(false);
                }, 1500);
            } else {
                alert("Publish failed: " + data.error);
                setIsPublishing(false);
            }
        } catch (error) {
            console.error("Publishing failed", error);
            alert("Failed to publish document.");
            setIsPublishing(false);
        }
    };

    const handleSave = async () => {
        if (!currentPage?.documentId) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/docs/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentId: currentPage.documentId,
                    content: editorContent,
                    saveOnly: true
                })
            });
            const data = await res.json();
            if (data.success) {
                setDocPages(prev => prev.map(p => p.id === activePage ? { ...p, content: editorContent } : p));
                setIsEditing(false);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    const fetchHistory = async () => {
        if (!currentPage?.documentId) return;
        setLoadingHistory(true);
        setShowHistory(true);
        try {
            const res = await fetch(`/api/docs/history?documentId=${currentPage.documentId}`);
            if (res.ok) {
                const data = await res.json();
                setHistoryLogs(data.logs || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingHistory(false);
        }
    };

    if (!repoName) return <EmptyState />;
    if (isLoadingPlan) return <LoadingState progress={progress} statusMessage={statusMessage} repoName={repoName} />;
    if (error) return <ErrorState error={error} />;

    return (
        <div className="flex h-screen bg-[#0A0A0B] text-white">

            {/* Sidebar */}
            <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                className={`fixed inset-y-0 left-0 z-40 w-72 bg-black/40 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex h-16 items-center px-6 border-b border-white/5 gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Book className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className="font-semibold tracking-tight truncate flex-1">{repoName.includes('/') ? repoName.split('/')[1] : repoName}</span>
                </div>

                <div className="p-4 space-y-8 overflow-y-auto h-[calc(100vh-64px)]">
                    {/* Categories */}
                    {Array.from(new Set(docPages.map(p => p.category))).map(category => (
                        <div key={category} className="space-y-2">
                            <h3 className="px-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
                                {category}
                            </h3>
                            <div className="space-y-0.5">
                                {docPages.filter(p => p.category === category).map(page => (
                                    <button
                                        key={page.id}
                                        onClick={() => { setActivePage(page.id); setIsSidebarOpen(false); setIsEditing(false); }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${activePage === page.id ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${page.content ? 'bg-green-500/50' : page.isGenerating ? 'bg-amber-500 animate-pulse' : 'bg-white/10'}`} />
                                        <span className="truncate">{page.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Header */}
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/20 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
                            <Menu className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center text-sm text-zinc-500">
                            <Home className="w-4 h-4 mr-2" />
                            <ChevronRight className="w-4 h-4 mx-1" />
                            <span className="text-zinc-300">{currentPage?.category || '...'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 hover:text-white gap-2"
                            onClick={fetchHistory}
                        >
                            <History className="w-4 h-4" />
                            <span className="hidden sm:inline">History</span>
                        </Button>

                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRegenerate}
                                    disabled={isRegenerating}
                                    className="text-indigo-400 hover:bg-indigo-500/10 mr-2"
                                >
                                    {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                    <span className="ml-2">Regenerate AI</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsEditing(false)}
                                    className="text-zinc-400"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                                disabled={!currentPage?.content || currentPage?.isGenerating}
                                className="border-white/10 hover:bg-white/5 text-zinc-300 gap-2"
                            >
                                <Edit2 className="w-4 h-4" />
                                Edit
                            </Button>
                        )}

                        <div className="h-4 w-px bg-white/10 mx-1" />

                        {/* Preview Button */}
                        {currentPage?.publicSlug && currentPage?.isPublished && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`/p/${currentPage.publicSlug}`, '_blank')}
                                className="text-zinc-400 hover:text-white gap-2"
                            >
                                <Eye className="w-4 h-4" />
                                <span className="hidden sm:inline">Preview</span>
                            </Button>
                        )}

                        <Button
                            variant="default"
                            size="sm"
                            disabled={!currentPage?.content || currentPage?.isGenerating || !currentPage?.documentId || isPublishing}
                            onClick={handlePublish}
                            className={`gap-2 transition-all ${currentPage?.isPublished
                                ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                                : 'bg-white text-black hover:bg-zinc-200'}`}
                        >
                            {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : currentPage?.isPublished ? <CheckCircle2 className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                            {isPublishing ? 'Publishing...' : currentPage?.isPublished ? 'Publish Again' : 'Publish Project'}
                        </Button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto relative">
                    <div className="max-w-4xl mx-auto px-8 py-12">
                        {currentPage ? (
                            <div className="space-y-8">
                                <div className="space-y-4 border-b border-white/5 pb-8">
                                    <motion.h1
                                        key={currentPage.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-4xl font-bold tracking-tight text-white"
                                    >
                                        {currentPage.title}
                                    </motion.h1>
                                    <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
                                        {currentPage.description}
                                    </p>
                                </div>

                                <div className="pb-20">
                                    {currentPage.isGenerating ? (
                                        <div className="flex flex-col items-center justify-center p-12 space-y-4 text-zinc-500 animate-pulse">
                                            <Sparkles className="w-8 h-8 text-indigo-400" />
                                            <p>Generating technical content...</p>
                                        </div>
                                    ) : (!isEditing && currentPage.content?.startsWith("> **Error")) ? (
                                        <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-8 flex flex-col items-center text-center space-y-4">
                                            <AlertCircle className="w-10 h-10 text-red-400" />
                                            <div>
                                                <h3 className="text-lg font-medium text-red-200">Content Generation Failed</h3>
                                                <p className="text-sm text-red-300/60 mt-1 max-w-md">There was an issue generating the content for this section. You can try regenerating it.</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <Button size="sm" onClick={handleRegenerate} disabled={isRegenerating} variant="outline" className="border-red-500/20 hover:bg-red-500/10 text-red-300">
                                                    {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                    Regenerate Content
                                                </Button>
                                                <Button size="sm" onClick={() => setIsEditing(true)} variant="ghost" className="text-zinc-400 hover:text-white">
                                                    Edit Manually
                                                </Button>
                                            </div>
                                            <div className="mt-4 p-4 bg-black/40 rounded-lg max-w-full overflow-auto text-left w-full border border-white/5">
                                                <pre className="text-xs text-zinc-500 whitespace-pre-wrap font-mono">{currentPage.content}</pre>
                                            </div>
                                        </div>
                                    ) : isEditing ? (
                                        <div className="relative">
                                            <textarea
                                                className="w-full h-[60vh] bg-zinc-900/50 border border-white/10 rounded-xl p-6 text-zinc-200 font-mono text-sm leading-6 resize-none focus:outline-none focus:border-indigo-500/50 transition-colors"
                                                value={editorContent}
                                                onChange={(e) => setEditorContent(e.target.value)}
                                                spellCheck={false}
                                            />
                                            <div className="absolute bottom-4 right-4 text-xs text-zinc-500 bg-black/50 px-2 py-1 rounded backdrop-blur">
                                                Markdown Supported
                                            </div>
                                        </div>
                                    ) : (
                                        <article className="prose prose-invert prose-zinc max-w-none prose-headings:font-semibold prose-a:text-indigo-400 hover:prose-a:text-indigo-300 prose-code:text-indigo-200 prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/5">
                                            <ReactMarkdown>{currentPage.content || ""}</ReactMarkdown>
                                        </article>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-zinc-500">
                                Select a page to view documentation
                            </div>
                        )}
                    </div>
                </div>

                {/* History Sidebar Panel */}
                <AnimatePresence>
                    {showHistory && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowHistory(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
                            />
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="absolute top-0 right-0 bottom-0 w-80 bg-[#0A0A0B] border-l border-white/10 z-50 shadow-2xl flex flex-col"
                            >
                                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="font-semibold text-white flex items-center gap-2">
                                        <History className="w-4 h-4 text-indigo-400" />
                                        Version History
                                    </h3>
                                    <button onClick={() => setShowHistory(false)} className="text-zinc-500 hover:text-white">
                                        <ArrowRight className="w-4 h-4 transform rotate-180" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {loadingHistory ? (
                                        <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-zinc-500" /></div>
                                    ) : historyLogs.length === 0 ? (
                                        <p className="text-zinc-500 text-sm text-center">No edits recorded yet.</p>
                                    ) : (
                                        historyLogs.map((log) => (
                                            <div key={log.id} className="relative pl-4 border-l border-white/10 pb-4 last:pb-0">
                                                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-600" />
                                                <div className="text-sm font-medium text-zinc-200 mb-0.5">
                                                    {log.summary || 'Update'}
                                                </div>
                                                <div className="text-xs text-zinc-500">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

            </main>
        </div>
    );
}

// ... LoadingUrl, EmptyState, ErrorState components (keep them as is or inline if they were imported)
// Assuming they are simple, I will recreate them briefly to ensure the file is complete self-contained if they were missing,
// but based on previous file they were likely separate or at bottom.
// I will just stub them if they are not standard imports.
// Actually, I saw them used in previous code. I'll paste them back.

function EmptyState() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0B] text-white p-4">
            <div className="max-w-md text-center space-y-6">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto ring-1 ring-white/10">
                    <Search className="w-8 h-8 text-white/40" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">No Repository Selected</h1>
                    <p className="text-sm text-zinc-500 mt-2">Please go back home and enter a GitHub URL to start.</p>
                </div>
                <Button asChild className="rounded-full bg-white text-black hover:bg-zinc-200">
                    <a href="/">Return Home</a>
                </Button>
            </div>
        </div>
    );
}

function ErrorState({ error }: { error: string }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0B] text-white p-4">
            <div className="max-w-md text-center space-y-4">
                <div className="p-3 bg-red-500/10 rounded-full w-fit mx-auto">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <h1 className="text-lg font-semibold text-red-400">Generation Failed</h1>
                <p className="text-sm text-zinc-500">{error}</p>
                <Button asChild variant="outline" className="mt-4 border-white/10">
                    <a href="/">Try Again</a>
                </Button>
            </div>
        </div>
    );
}

function LoadingState({ progress, statusMessage, repoName }: any) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0B] text-white p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.05),transparent_70%)]" />

            <div className="max-w-md w-full space-y-8 relative z-10 text-center">
                <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 rounded-full border-2 border-white/5 animate-[spin_10s_linear_infinite]" />
                    <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight">Analyzing Repository</h2>
                    <p className="text-sm text-zinc-400 font-mono">{repoName}</p>
                </div>

                <div className="space-y-3">
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-indigo-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                    <div className="flex justify-between text-xs font-mono text-zinc-500">
                        <span>{statusMessage}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

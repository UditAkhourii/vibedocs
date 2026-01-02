"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, FileText, ChevronRight, Menu, X, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatWidget } from "@/components/ChatWidget";
import { ChatSidebar } from "@/components/ChatSidebar";
import ReactMarkdown from "react-markdown";
import { MermaidDiagram } from "@/components/MermaidDiagram";
import { ThemeToggle } from "@/components/ThemeToggle";

interface PublicDocLayoutProps {
    doc: any;
    categories: string[];
    groupedSiblings: { [key: string]: any[] };
    siblings: any[];
    slug: string;
}

export function PublicDocLayout({ doc, categories, groupedSiblings, siblings, slug }: PublicDocLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(doc.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-background/95 backdrop-blur-xl md:bg-muted/20 border-r border-border/40">
            <div className="p-3 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold tracking-tight px-1">
                    <div className="w-5 h-5 rounded bg-primary text-primary-foreground flex items-center justify-center">
                        <Sparkles className="w-3 h-3" />
                    </div>
                    <Link href="/" className="hover:opacity-80">SuperDocs</Link>
                </div>
                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="lg:hidden p-1 hover:bg-muted rounded-md"
                >
                    <X className="w-5 h-5 opacity-70" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
                <div className="space-y-6">
                    {categories.map(category => (
                        <div key={category}>
                            <h4 className="mb-2 px-2 text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">
                                {category}
                            </h4>
                            <div className="space-y-0.5">
                                {groupedSiblings[category].map(page => (
                                    <Link
                                        key={page.id}
                                        href={`/p/${page.publicSlug}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`
                                            w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all duration-200 group text-left
                                            ${page.publicSlug === slug
                                                ? "bg-primary/10 text-primary font-medium"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            }
                                        `}
                                    >
                                        <FileText className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                        <span className="truncate">{page.title}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                    {siblings.length === 0 && (
                        <div className="px-2 text-muted-foreground">No other pages.</div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-border/40 text-xs text-muted-foreground text-center">
                Powered by SuperDocs
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden text-sm">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-[260px] flex-col shrink-0">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar (Overlay) */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed inset-y-0 left-0 w-[280px] z-50 lg:hidden shadow-2xl"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-background">
                {/* Header */}
                <header className="h-12 border-b flex items-center justify-between px-4 lg:px-8 bg-background/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Trigger */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-1 -ml-1 hover:bg-muted rounded-md"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground overflow-hidden">
                            <span className="truncate max-w-[100px]">{doc.repoName}</span>
                            <ChevronRight className="w-3 h-3 opacity-50 shrink-0" />
                            <span className="text-foreground font-medium truncate">{doc.title}</span>
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <button className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Create New Docs
                            </button>
                        </Link>
                        <button
                            onClick={handleCopy}
                            className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy Markdown"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <ThemeToggle />
                    </div>
                </header>

                {/* Content Scroller */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto px-6 py-10 lg:px-8 lg:py-12">
                        <div className="prose prose-zinc dark:prose-invert max-w-none 
                                    prose-headings:text-foreground prose-headings:font-semibold prose-headings:tracking-tight 
                                    prose-h1:text-3xl prose-h1:mb-6
                                    prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
                                    prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:mb-4
                                    prose-strong:text-foreground prose-strong:font-bold
                                    [&_code:not(pre_code)]:text-indigo-300 [&_code:not(pre_code)]:bg-indigo-500/15 [&_code:not(pre_code)]:px-1.5 [&_code:not(pre_code)]:py-0.5 [&_code:not(pre_code)]:rounded [&_code:not(pre_code)]:before:content-none [&_code:not(pre_code)]:after:content-none
                                    prose-pre:bg-[#0F0F11] prose-pre:border prose-pre:border-border/40 prose-pre:p-4 prose-pre:rounded-xl
                                ">
                            <h1 className="flex items-center gap-3 border-b border-border/40 pb-4 mb-8 text-foreground font-bold">
                                {doc.title}
                            </h1>
                            <ReactMarkdown
                                components={{
                                    pre: ({ children }) => (
                                        <div className="relative group my-6">
                                            <pre className="not-prose bg-[#0D0D0E] border border-white/5 rounded-xl p-4 overflow-x-auto text-sm leading-relaxed">
                                                {children}
                                            </pre>
                                        </div>
                                    ),
                                    code: ({ node, className, children, ...props }: any) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        const isMermaid = match && match[1] === 'mermaid';

                                        if (isMermaid) {
                                            return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
                                        }

                                        const isInline = !match;
                                        const content = String(children).replace(/\n$/, '');
                                        if (isInline) {
                                            return (
                                                <code className="text-indigo-300 bg-indigo-500/15 px-1.5 py-0.5 rounded font-mono text-[0.85em] border border-indigo-500/10" {...props}>
                                                    {content}
                                                </code>
                                            );
                                        }
                                        return <code className="text-zinc-300 font-mono" {...props}>{children}</code>;
                                    },
                                    ul: ({ children }) => <ul className="list-disc pl-6 space-y-2 mb-6 text-foreground/80">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal pl-6 space-y-2 mb-6 text-foreground/80">{children}</ol>,
                                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                }}
                            >
                                {doc.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            </main>
            {/* Right Sidebar (Chat) */}
            <aside className="hidden xl:flex w-[350px] shrink-0 border-l border-border/40 bg-background/20 backdrop-blur-xl">
                <ChatSidebar documentId={doc.id} />
            </aside>

            {/* Mobile Chat (Optional: could keep widget for mobile/tablet) */}
            <div className="xl:hidden">
                <ChatWidget documentId={doc.id} />
            </div>
        </div>
    );
}

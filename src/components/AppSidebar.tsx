"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Book,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Github,
    Sparkles,
    FolderGit,
    Home,
    FileText,
    Code2,
    Blocks,
    Plus,
    Globe,
    Menu,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function AppSidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [projects, setProjects] = useState<{ name: string }[]>([]);
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<any>(null); // Use standard user type
    const supabase = createClient();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        async function fetchProjects() {
            try {
                const res = await fetch('/api/user/projects');
                if (res.ok) {
                    const data = await res.json();
                    setProjects(data.projects || []);
                }
            } catch (e) {
                console.error("Failed to load projects", e);
            }
        }
        fetchProjects();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    if (!mounted) return null;

    // Don't show sidebar on login or public pages OR if user is not logged in
    if (pathname === '/login' || pathname.startsWith('/p/') || !user) return null;

    return (
        <>
            <div className={`md:hidden fixed top-6 left-6 z-40 ${isMobileOpen ? 'hidden' : 'block'}`}>
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="p-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white/60 hover:text-white shadow-lg"
                >
                    <Menu size={20} />
                </button>
            </div>

            {isMobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/80 z-40 backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <motion.div
                initial={{ width: 240 }}
                animate={{ width: isCollapsed ? 72 : 240 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`
                    flex flex-col h-screen border-r border-white/10
                    bg-black/80 md:bg-black/40 backdrop-blur-xl 
                    fixed md:sticky top-0 z-50
                    ${isMobileOpen ? 'left-0' : '-left-full md:left-0'}
                    transition-[left] duration-300 ease-in-out
                `}
            >
                {/* Mobile Close Button */}
                <div className="md:hidden absolute top-4 right-4 z-50">
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="p-1 text-zinc-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>
                {/* Header */}
                <div className="flex items-center h-14 px-4 border-b border-white/5">
                    <div className={`flex items-center gap-2 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}>
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="font-bold text-white tracking-tight whitespace-nowrap"
                            >
                                SuperDocs
                            </motion.span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">

                    {/* Main Nav */}
                    <div className="px-3 space-y-1">
                        <Link href="/" className="block mb-4">
                            <div className={`
                            relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                            bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20
                            ${isCollapsed ? 'justify-center' : ''}
                        `}>
                                <span className="shrink-0"><Plus size={20} /></span>
                                {!isCollapsed && <span className="text-sm font-medium truncate">Create New Doc</span>}
                            </div>
                        </Link>

                        <SidebarItem
                            icon={<Home size={20} />}
                            label="Home"
                            href="/dashboard"
                            isActive={pathname === '/dashboard'}
                            isCollapsed={isCollapsed}
                        />
                        <SidebarItem
                            icon={<FileText size={20} />}
                            label="My Docs"
                            href="/documents"
                            isActive={pathname === '/documents'}
                            isCollapsed={isCollapsed}
                        />
                        <SidebarItem
                            icon={<Globe size={20} />}
                            label="Explore Docs"
                            href="/explore"
                            isActive={pathname === '/explore'}
                            isCollapsed={isCollapsed}
                        />
                        <SidebarItem
                            icon={<Blocks size={20} />}
                            label="Integrations"
                            href="/integrations"
                            isActive={pathname === '/integrations'}
                            isCollapsed={isCollapsed}
                        />
                        <SidebarItem
                            icon={<Settings size={20} />}
                            label="Settings"
                            href="/settings"
                            isActive={pathname === '/settings'}
                            isCollapsed={isCollapsed}
                        />
                    </div>

                    {/* Projects Section */}
                    <div className="px-3 space-y-1">
                        {!isCollapsed && (
                            <h3 className="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                                Projects
                            </h3>
                        )}
                        {projects.map((project) => (
                            <SidebarItem
                                key={project.name}
                                icon={<FolderGit size={20} />}
                                label={project.name.replace('https://github.com/', '')}
                                href={`/docs?repo=${encodeURIComponent(project.name)}`}
                                isActive={pathname === '/docs' && window.location.search.includes(encodeURIComponent(project.name))}
                                isCollapsed={isCollapsed}
                            />
                        ))}
                        {projects.length === 0 && !isCollapsed && (
                            <div className="px-2 text-xs text-zinc-600 italic">No projects yet</div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/5 space-y-1">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        {isCollapsed ? <ChevronRight size={20} className="mx-auto" /> : <ChevronLeft size={20} />}
                        {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
                    </button>

                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut size={20} className={isCollapsed ? 'mx-auto' : ''} />
                        {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
                    </button>
                </div>
            </motion.div>
        </>
    );
}

function SidebarItem({ icon, label, href, isActive, isCollapsed }: any) {
    const content = (
        <div className={`
            relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
            ${isActive
                ? 'bg-indigo-500/10 text-indigo-300'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }
            ${isCollapsed ? 'justify-center' : ''}
        `}>
            <span className={`shrink-0 ${isActive ? 'text-indigo-400' : 'group-hover:text-indigo-400 transition-colors'}`}>
                {icon}
            </span>

            {!isCollapsed && (
                <span className="text-sm font-medium truncate">
                    {label}
                </span>
            )}

            {isActive && !isCollapsed && (
                <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full"
                />
            )}
        </div>
    );

    if (isCollapsed) {
        return (
            <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Link href={href} className="block">{content}</Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-black border-white/10 text-white">
                        {label}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <Link href={href} className="block">
            {content}
        </Link>
    );
}

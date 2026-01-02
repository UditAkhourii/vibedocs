"use client";

import { useEffect, useState } from "react";
import { FolderGit, Loader2, ArrowRight, MoreVertical, Trash2, Globe, AlertCircle } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function MyDocsPage() {
    const [projects, setProjects] = useState<{ name: string; lastUpdated: string; isDiscoverable: boolean }[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState<{ name: string; isDiscoverable: boolean } | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    async function fetchProjects() {
        try {
            const res = await fetch('/api/user/projects');
            if (res.ok) {
                const data = await res.json();
                setProjects(data.projects || []);
            }
        } catch (e) {
            console.error("Failed to load projects", e);
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async () => {
        if (!selectedProject) return;
        if (!confirm(`Are you sure you want to delete ${selectedProject.name}? This cannot be undone.`)) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/docs/settings?repoName=${encodeURIComponent(selectedProject.name)}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setProjects(projects.filter(p => p.name !== selectedProject.name));
                setIsSettingsOpen(false);
            }
        } catch (e) {
            console.error(e);
            alert("Delete failed");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleVisibilityToggle = async (checked: boolean) => {
        if (!selectedProject) return;

        // Optimistic update
        setProjects(projects.map(p => p.name === selectedProject.name ? { ...p, isDiscoverable: checked } : p));
        setSelectedProject({ ...selectedProject, isDiscoverable: checked });

        try {
            await fetch('/api/docs/settings', {
                method: 'PATCH',
                body: JSON.stringify({
                    repoName: selectedProject.name,
                    isDiscoverable: checked
                })
            });
        } catch (e) {
            console.error(e);
            // Revert on fail
            fetchProjects();
        }
    };

    const openSettings = (e: React.MouseEvent, project: typeof projects[0]) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedProject(project);
        setIsSettingsOpen(true);
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Documentation</h1>
                    <p className="text-zinc-400 mt-2">Manage and view your generated project documentation.</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                    </div>
                ) : projects.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-12 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FolderGit className="w-8 h-8 text-zinc-500" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
                        <p className="text-zinc-400 mb-6">Start by generating documentation for a public GitHub repository.</p>
                        <Link href="/">
                            <button className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors">
                                Generate New Docs
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {projects.map((project) => (
                            <Link
                                href={`/docs?repo=${encodeURIComponent(project.name)}`}
                                key={project.name}
                                className="group block relative"
                            >
                                <div className="h-full rounded-xl border border-white/10 bg-zinc-900/30 p-6 transition-all hover:bg-zinc-900/50 hover:border-indigo-500/30">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                            <FolderGit className="w-5 h-5" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {project.isDiscoverable && (
                                                <div className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                                                    Public
                                                </div>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-zinc-500 hover:text-white"
                                                onClick={(e) => openSettings(e, project)}
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold truncate mb-1">
                                        {project.name.replace('https://github.com/', '')}
                                    </h3>
                                    <p className="text-xs text-zinc-500">
                                        Last updated {formatDistanceToNow(new Date(project.lastUpdated))} ago
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Project Settings</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Manage settings for {selectedProject?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-6">
                        {/* Visibility Toggle */}
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-1">
                                <Label htmlFor="visibility" className="text-base font-medium text-white flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-indigo-400" />
                                    Public Visibility
                                </Label>
                                <p className="text-xs text-zinc-400 leading-tight">
                                    Show this documentation on the Explore page.
                                </p>
                            </div>
                            <Switch
                                id="visibility"
                                checked={selectedProject?.isDiscoverable || false}
                                onCheckedChange={handleVisibilityToggle}
                            />
                        </div>

                        <div className="border-t border-white/10 pt-6">
                            <Label className="text-base font-medium text-red-400 flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4" />
                                Danger Zone
                            </Label>
                            <p className="text-xs text-zinc-500 mb-4">
                                Permanently delete this project and all its documentation.
                            </p>
                            <Button
                                variant="destructive"
                                className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                Delete Project
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

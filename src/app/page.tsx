"use client";
// Triggering deployment...


import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Github, CheckCircle2, AlertCircle, Sparkles, LogOut, User as UserIcon, Play, Terminal, ArrowRight, Phone, Lock, GitBranch, Loader2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { InteractiveGrid } from "@/components/ui/interactive-grid";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthModal } from "@/components/auth/auth-modal";
import { FeaturedDocs } from "@/components/home/featured-docs";
import { VideoModal } from "@/components/ui/video-modal";

export default function NewDocPage() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');
  const [activeVideo, setActiveVideo] = useState<'demo' | 'cli' | null>(null);

  // Repo Selection State
  const [repoSource, setRepoSource] = useState<'public' | 'private'>('public');
  const [userRepos, setUserRepos] = useState<any[]>([]);
  const [repoModalOpen, setRepoModalOpen] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoSearch, setRepoSearch] = useState("");
  const [githubConnected, setGithubConnected] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoadingUser(false);
    }
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsAuthModalOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  const handleSubmitGithub = async (url: string) => {
    if (!url) return;

    if (!user) {
      setAuthView('signup');
      setIsAuthModalOpen(true);
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
        body: JSON.stringify({ repoUrl: finalUrl, isPrivate: repoSource === 'private' })
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

  const handleSourceToggle = async (source: 'public' | 'private') => {
    setRepoSource(source);
    if (source === 'private') {
      if (!user) {
        setAuthView('signin');
        setIsAuthModalOpen(true);
        return;
      }
      setRepoModalOpen(true);
      await fetchRepos();
    }
  };

  const fetchRepos = async () => {
    setLoadingRepos(true);
    try {
      const res = await fetch('/api/github/repos');
      const data = await res.json();
      setGithubConnected(data.connected);
      setUserRepos(data.repos || []);
    } catch (error) {
      console.error("Failed to fetch repos", error);
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleConnectGithub = async () => {
    try {
      if (user) {
        const { error } = await supabase.auth.linkIdentity({
          provider: 'github',
          options: {
            redirectTo: `${window.location.origin}/`,
            scopes: 'repo',
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: {
            redirectTo: `${window.location.origin}/`,
            scopes: 'repo',
          },
        });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error("GitHub connection error:", err);
      setError(err.message || "Failed to connect GitHub");
    }
  };

  const filteredRepos = userRepos.filter(repo =>
    repo.name.toLowerCase().includes(repoSearch.toLowerCase())
  );

  return (
    <div className="relative flex min-h-screen flex-col bg-[#0A0A0B] overflow-x-hidden selection:bg-indigo-500/30">
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultView={authView}
      />

      <Dialog open={repoModalOpen} onOpenChange={setRepoModalOpen}>
        <DialogContent className="max-w-2xl bg-[#141416] border-white/10 text-white max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Repository</DialogTitle>
          </DialogHeader>

          {!githubConnected && !loadingRepos ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <Github className="w-12 h-12 text-zinc-500" />
              <p className="text-zinc-400 text-center">Connect GitHub to access your private repositories.</p>
              <Button onClick={handleConnectGithub} className="bg-white text-black hover:bg-white/90">
                Connect GitHub
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 flex-1 overflow-hidden">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                  placeholder="Search repositories..."
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                />
              </div>

              {loadingRepos ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {filteredRepos.map(repo => (
                    <button
                      key={repo.id}
                      onClick={() => {
                        handleSubmitGithub(repo.url);
                        setRepoModalOpen(false);
                      }}
                      className="w-full text-left p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {repo.private ? <Lock className="w-3 h-3 text-amber-400" /> : <Github className="w-3 h-3 text-zinc-400" />}
                          <span className="font-medium text-sm group-hover:text-indigo-400 transition-colors">{repo.name}</span>
                        </div>
                        <span className="text-[10px] text-zinc-600">
                          {new Date(repo.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {repo.description && (
                        <p className="text-xs text-zinc-500 mt-1 truncate">{repo.description}</p>
                      )}
                    </button>
                  ))}
                  {filteredRepos.length === 0 && (
                    <p className="text-center text-zinc-500 py-8 text-sm">No repositories found.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Header Buttons */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2 group-has-[[data-sidebar=open]]:pr-4">
        <Button
          variant="ghost"
          className="text-white/60 hover:text-white hover:bg-white/5 h-9 px-3"
          onClick={() => setActiveVideo('demo')}
        >
          <Play className="w-3.5 h-3.5 sm:mr-2" />
          <span className="hidden sm:inline">Watch Demo</span>
        </Button>

        <Button
          variant="ghost"
          className="text-white/60 hover:text-white hover:bg-white/5 h-9 px-3 mr-2"
          onClick={() => setActiveVideo('cli')}
        >
          <Terminal className="w-3.5 h-3.5 sm:mr-2" />
          <span className="hidden sm:inline">CLI</span>
          <span className="ml-2 bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full border border-indigo-500/30">NEW</span>
        </Button>

        <Button
          variant="ghost"
          className="text-white/60 hover:text-white hover:bg-white/5 h-9 px-3"
          onClick={() => window.open('https://cal.com/autorel-wq308x/15min', '_blank')}
        >
          <Phone className="w-3.5 h-3.5 sm:mr-2" />
          <span className="hidden sm:inline">Book A Free Call</span>
        </Button>

        {!loadingUser && (
          user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                <UserIcon className="w-3 h-3" />
                <span className="max-w-[100px] truncate">{user.email}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white h-9"
                onClick={() => {
                  setAuthView('signup');
                  setIsAuthModalOpen(true);
                }}
              >
                Sign Up or Login
              </Button>
            </div>
          )
        )}
      </div>


      <InteractiveGrid />

      <div className="relative z-10 flex flex-col items-center justify-center pt-32 pb-12 p-6 w-full">

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
                    placeholder={repoSource === 'private' ? "Select a private repository..." : "Paste public repository URL (e.g. facebook/react)"}
                    disabled={repoSource === 'private'}
                    value={repoSource === 'private' ? "Click to select repository..." : undefined}
                    repoMode={repoSource}
                    onRepoModeChange={handleSourceToggle}
                    onClick={() => {
                      if (repoSource === 'private') {
                        if (!user) {
                          setAuthView('signin');
                          setIsAuthModalOpen(true);
                        } else {
                          if (userRepos.length === 0) fetchRepos();
                          setRepoModalOpen(true);
                        }
                      }
                    }}
                  />
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
                      onClick={() => window.location.href = `/docs?repo=${analysisResult.metadata.id}&mode=new`}
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
      <FeaturedDocs />

      {/* Video Modals */}
      <VideoModal
        isOpen={activeVideo === 'demo'}
        onClose={() => setActiveVideo(null)}
        videoId="RoljHC3QTIE"
        title="SuperDocs Demo"
      />

      <VideoModal
        isOpen={activeVideo === 'cli'}
        onClose={() => setActiveVideo(null)}
        videoId="7VyjCQyiKPo"
        title="SuperDocs CLI"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="text-white font-medium text-sm">Install SuperDocs CLI</h4>
            <p className="text-xs text-zinc-500 mt-1">Generate documentation directly from your terminal.</p>
          </div>
          <Button
            className="bg-white text-black hover:bg-white/90 w-full sm:w-auto"
            onClick={() => window.open('https://www.npmjs.com/package/superdocs-cli', '_blank')}
          >
            Install with NPM <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </VideoModal>
    </div>
  );
}

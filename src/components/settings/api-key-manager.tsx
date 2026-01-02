"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Key, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApiKey {
    id: string;
    key: string;
    name: string;
    createdAt: string;
    lastUsed: string | null;
}

export function ApiKeyManager() {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        try {
            const res = await fetch('/api/user/keys');
            if (res.ok) {
                const data = await res.json();
                setKeys(data.keys);
            }
        } finally {
            setLoading(false);
        }
    };

    const generateKey = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/user/keys', {
                method: 'POST',
                body: JSON.stringify({ name: `CLI Token - ${new Date().toLocaleDateString()}` })
            });
            if (res.ok) {
                fetchKeys();
            }
        } finally {
            setGenerating(false);
        }
    };

    const deleteKey = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this token?')) return;
        try {
            await fetch(`/api/user/keys?id=${id}`, { method: 'DELETE' });
            setKeys(keys.filter(k => k.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium text-white">Personal Access Tokens</h3>
                    <p className="text-xs text-zinc-500">Tokens you have generated that can be used to access the SuperDocs API.</p>
                </div>
                <Button
                    onClick={generateKey}
                    disabled={generating}
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/10"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Generate New Token
                </Button>
            </div>

            {loading ? (
                <div className="text-sm text-zinc-500">Loading tokens...</div>
            ) : keys.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-white/10 rounded-lg text-zinc-500 text-sm">
                    No active tokens found. Generate one to use the CLI.
                </div>
            ) : (
                <div className="space-y-2">
                    {keys.map((key) => (
                        <div key={key.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-400">
                                    <Key className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">{key.name}</div>
                                    <div className="text-xs text-zinc-500 font-mono mt-0.5">
                                        {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => copyToClipboard(key.key, key.id)}
                                    className="p-2 text-zinc-400 hover:text-white transition-colors"
                                    title="Copy Token"
                                >
                                    {copiedId === key.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => deleteKey(key.id)}
                                    className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                                    title="Revoke Token"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

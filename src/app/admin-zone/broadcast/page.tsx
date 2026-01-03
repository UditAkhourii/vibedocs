'use client';

import { useState } from 'react';
import { Send, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function BroadcastPage() {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ total: number; sent: number; failed: number } | null>(null);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) {
            alert('Please fill in both fields.');
            return;
        }

        if (!confirm(`⚠️ ARE YOU SURE?\n\nThis will email ALL users immediately.\nSubject: "${subject}"`)) {
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/admin/emails/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, message }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to broadcast');
            }

            setResult(data);
            setSubject('');
            setMessage('');
            alert(`Broadcast Complete! Sent to ${data.sent} users.`);

        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 text-white">
            <div className="border-b border-white/10 pb-6">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Broadcast Email</h1>
                <p className="text-zinc-400">Send an email notification to all registered users.</p>
            </div>

            {/* Warning Banner */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-4 items-start">
                <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-yellow-500 font-medium mb-1">Warning: Mass Action</h3>
                    <p className="text-sm text-yellow-200/80">
                        This action retrieves all users and sends an email to each one sequentially using your SMTP server.
                        Please ensure your subject and message are correct before sending.
                    </p>
                </div>
            </div>

            {result && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex gap-4 items-start animate-fade-in">
                    <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-green-500 font-medium mb-1">Broadcast Completed</h3>
                        <div className="flex gap-4 mt-2 text-sm text-green-200/80">
                            <span>Total Users: <strong>{result.total}</strong></span>
                            <span>Sent: <strong>{result.sent}</strong></span>
                            <span>Failed: <strong>{result.failed}</strong></span>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSend} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Subject Line</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="e.g., Important Update: SuperDocs v2 is here!"
                        className="w-full bg-[#141416] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-zinc-600"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Message Body (Plain Text)</label>
                    <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Write your message here... (New lines will be preserved)"
                        rows={10}
                        className="w-full bg-[#141416] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-zinc-600 resize-y"
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {loading ? 'Sending Broadcast...' : 'Wait... Send to Everyone'}
                    </button>
                </div>
            </form>
        </div>
    );
}

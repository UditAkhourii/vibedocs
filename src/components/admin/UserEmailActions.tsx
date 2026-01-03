'use client';

import { useState } from 'react';
import { Mail, Loader2, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserEmailActionsProps {
    userId: string;
    initialWelcomeSent: boolean;
    initialNudgeCount: number;
}

export function UserEmailActions({ userId, initialWelcomeSent, initialNudgeCount }: UserEmailActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const handleSend = async (type: string) => {
        if (!confirm(`Are you sure you want to send the ${type} email?`)) return;

        setLoading(type);
        try {
            const res = await fetch('/api/admin/emails/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, type }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to send');
            }

            alert('Email sent successfully!');
            router.refresh(); // Refresh server data
        } catch (error) {
            console.error(error);
            alert('Failed to send email.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Welcome Email Action */}
            <div className="bg-[#141416] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-medium text-white mb-1">Welcome Email</h4>
                    <span className={`text-xs px-2 py-0.5 rounded ${initialWelcomeSent ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                        {initialWelcomeSent ? "Previously Sent" : "Not Sent Yet"}
                    </span>
                </div>
                <button
                    onClick={() => handleSend('welcome')}
                    disabled={!!loading}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
                >
                    {loading === 'welcome' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                    Send Now
                </button>
            </div>

            {/* Nudge Actions */}
            <div className="bg-[#141416] border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-white">Engagement Nudges</h4>
                    <span className="text-xs text-zinc-500">Current Stage: {initialNudgeCount}</span>
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3].map(stage => (
                        <button
                            key={stage}
                            onClick={() => handleSend(`nudge-${stage}`)}
                            disabled={!!loading}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs border transition-colors
                                ${initialNudgeCount >= stage
                                    ? 'border-green-500/30 text-green-400 bg-green-500/10'
                                    : 'border-white/10 text-zinc-400 hover:bg-white/5'
                                }
                            `}
                        >
                            {loading === `nudge-${stage}` ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            {initialNudgeCount >= stage ? <Check className="w-3 h-3" /> : stage}
                            {stage === 1 ? 'Help' : stage === 2 ? 'Tip' : 'Final'}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

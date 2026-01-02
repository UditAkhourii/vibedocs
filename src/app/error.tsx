'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0B] text-white p-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>

                <h2 className="text-2xl font-bold">Something went wrong!</h2>
                <p className="text-zinc-400">
                    We encountered an unexpected error while loading this page.
                </p>

                <button
                    onClick={() => reset()}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors mx-auto"
                >
                    <RefreshCcw size={18} />
                    Try again
                </button>
            </div>
        </div>
    );
}

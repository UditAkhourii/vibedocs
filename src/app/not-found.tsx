import Link from "next/link";
import { ArrowLeft, Search, FileQuestion } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0B] text-white p-4">
            <div className="text-center space-y-6 max-w-md">

                {/* Icon */}
                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 animate-pulse">
                    <FileQuestion className="w-10 h-10 text-indigo-400" />
                </div>

                {/* Text */}
                <h1 className="text-4xl font-bold tracking-tight">Page Not Found</h1>
                <p className="text-zinc-400 text-lg">
                    Looks like this documentation page has moved or doesn't exist.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
                    <Link href="/">
                        <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-zinc-200 transition-colors w-full sm:w-auto">
                            <ArrowLeft size={18} />
                            Back Home
                        </button>
                    </Link>
                    <Link href="/explore">
                        <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors w-full sm:w-auto">
                            <Search size={18} />
                            Explore Docs
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

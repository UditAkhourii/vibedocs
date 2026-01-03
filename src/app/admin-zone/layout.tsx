
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, FileText, Settings, LogOut, ShieldAlert, Megaphone } from "lucide-react";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Check Role
    const dbUser = await db.user.findUnique({
        where: { authId: user.id }
    });

    if (!dbUser || dbUser.role !== 'admin') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4 text-center space-y-4">
                <ShieldAlert className="w-16 h-16 text-red-500" />
                <h1 className="text-3xl font-bold">Access Denied</h1>
                <p className="text-zinc-400">You do not have permission to view this area.</p>
                <Link href="/dashboard" className="px-4 py-2 bg-white text-black rounded-lg">Return to Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#0A0A0B]">
            {/* Admin Sidebar */}
            <aside className="w-64 border-r border-white/10 bg-black/50 p-4 hidden md:flex flex-col">
                <div className="mb-8 px-2 flex items-center gap-2 text-indigo-400">
                    <ShieldAlert className="w-6 h-6" />
                    <span className="font-bold text-lg tracking-tight">Admin Zone</span>
                </div>

                <nav className="space-y-1 flex-1">
                    <Link href="/admin-zone" className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                        <LayoutDashboard size={18} />
                        <span>Overview</span>
                    </Link>
                    <Link href="/admin-zone/users" className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                        <Users size={18} />
                        <span>Users</span>
                    </Link>
                    <Link href="/admin-zone/docs" className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                        <FileText size={18} />
                        <span>Documents</span>
                    </Link>
                    <Link href="/admin-zone/broadcast" className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                        <Megaphone size={18} />
                        <span>Broadcast</span>
                    </Link>
                </nav>

                <div className="mt-auto pt-4 border-t border-white/5">
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
                        <LogOut size={18} />
                        <span>Exit Admin</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}

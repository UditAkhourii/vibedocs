
import { db } from "@/lib/db";
import { Users, FileText, CheckCircle2, TrendingUp } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const totalUsers = await db.user.count();
    const totalDocs = await db.document.count();
    const publishedDocs = await db.document.count({ where: { isPublished: true } });

    const recentUsers = await db.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, createdAt: true }
    });

    return (
        <div className="space-y-8 text-white">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                <p className="text-zinc-400">Welcome back, Admin.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-[#141416] border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-400">Total Users</span>
                        <Users className="w-5 h-5 text-indigo-400" />
                    </div>
                    <p className="text-3xl font-bold">{totalUsers}</p>
                </div>
                <div className="p-6 rounded-2xl bg-[#141416] border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-400">Total Documents</span>
                        <FileText className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-3xl font-bold">{totalDocs}</p>
                </div>
                <div className="p-6 rounded-2xl bg-[#141416] border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-400">Published Docs</span>
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-3xl font-bold">{publishedDocs}</p>
                </div>
            </div>

            {/* Recent Users */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Recent Signups</h2>
                <div className="rounded-2xl border border-white/5 overflow-hidden">
                    <table className="w-full text-left bg-[#141416]">
                        <thead className="bg-white/5 text-xs uppercase text-zinc-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Email</th>
                                <th className="px-6 py-4 font-medium">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {recentUsers.map(user => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4 text-zinc-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

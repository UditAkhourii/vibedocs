
import { db } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
    const users = await db.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { documents: true }
            }
        }
    });

    return (
        <div className="space-y-8 text-white">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                <p className="text-zinc-400">Manage platform users.</p>
            </div>

            <div className="rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-left bg-[#141416]">
                    <thead className="bg-white/5 text-xs uppercase text-zinc-400">
                        <tr>
                            <th className="px-6 py-4 font-medium">Email</th>
                            <th className="px-6 py-4 font-medium">Role</th>
                            <th className="px-6 py-4 font-medium">Docs</th>
                            <th className="px-6 py-4 font-medium">Joined</th>
                            <th className="px-6 py-4 font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 font-medium">
                                    <Link href={`/admin-zone/users/${user.id}`} className="text-blue-400 hover:text-blue-300 transition-colors">
                                        {user.email}
                                    </Link>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-zinc-800 text-zinc-400'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-zinc-400">{user._count.documents}</td>
                                <td className="px-6 py-4 text-zinc-400">{formatDistanceToNow(new Date(user.createdAt))} ago</td>
                                <td className="px-6 py-4">
                                    <Link
                                        href={`/admin-zone/users/${user.id}`}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-md text-white"
                                    >
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

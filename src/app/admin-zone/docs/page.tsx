
import { db } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminDocsPage() {
    const docs = await db.document.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
            user: {
                select: { email: true }
            }
        }
    });

    return (
        <div className="space-y-8 text-white">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
                <p className="text-zinc-400">Moderate content.</p>
            </div>

            <div className="rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-left bg-[#141416]">
                    <thead className="bg-white/5 text-xs uppercase text-zinc-400">
                        <tr>
                            <th className="px-6 py-4 font-medium">Title</th>
                            <th className="px-6 py-4 font-medium">Repo</th>
                            <th className="px-6 py-4 font-medium">Owner</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {docs.map(doc => (
                            <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-medium">{doc.title}</td>
                                <td className="px-6 py-4 text-zinc-400 break-all max-w-xs">{doc.repoName}</td>
                                <td className="px-6 py-4 text-zinc-400">{doc.user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${doc.isPublished ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                        {doc.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {doc.isPublished && (
                                        <Link href={`/p/${doc.publicSlug}`} target="_blank" className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300">
                                            View <ExternalLink size={12} />
                                        </Link>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

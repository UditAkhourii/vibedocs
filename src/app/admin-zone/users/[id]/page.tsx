
import { db } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, XCircle, Mail, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserEmailActions } from "@/components/admin/UserEmailActions";

export const dynamic = 'force-dynamic';

interface PageProps {
    params: {
        id: string;
    }
}

export default async function AdminUserDetailPage({ params }: PageProps) {
    const { id } = await params;

    const user = await db.user.findUnique({
        where: { id },
        include: {
            documents: {
                orderBy: { updatedAt: 'desc' }
            }
        }
    });

    if (!user) {
        notFound();
    }

    return (
        <div className="space-y-8 text-white max-w-5xl">
            <div className="flex items-center gap-4">
                <Link href="/admin-zone/users" className="text-zinc-400 hover:text-white transition-colors">
                    ← Back to Users
                </Link>
            </div>

            <div className="border-b border-white/10 pb-6">
                <h1 className="text-3xl font-bold tracking-tight mb-2">{user.email}</h1>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <span className="bg-zinc-800 px-2 py-0.5 rounded text-white">{user.role}</span>
                    <span>ID: {user.id}</span>
                    <span>Joined {formatDistanceToNow(new Date(user.createdAt))} ago</span>
                </div>
            </div>

            {/* Email Audit Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Welcome Email">
                    <div className="flex items-center gap-3 mt-2">
                        {user.welcomeEmailSent ? (
                            <div className="flex items-center gap-2 text-green-400">
                                <CheckCircle2 className="w-5 h-5" />
                                <span>Sent</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-red-400">
                                <XCircle className="w-5 h-5" />
                                <span>Not Sent</span>
                            </div>
                        )}
                    </div>
                </Card>

                <Card title="Last Emailed">
                    <div className="flex items-center gap-3 mt-2 text-zinc-300">
                        <Mail className="w-5 h-5 text-zinc-500" />
                        <span>
                            {user.lastEmailedAt
                                ? `${formatDistanceToNow(new Date(user.lastEmailedAt))} ago`
                                : "Never"
                            }
                        </span>
                    </div>
                </Card>

                <Card title="Engagement Nudges">
                    <div className="flex items-center gap-3 mt-2 text-zinc-300">
                        <AlertCircle className="w-5 h-5 text-zinc-500" />
                        <span>{user.nudgeCount} / 3 sent</span>
                    </div>
                </Card>
            </div>

            {/* Manual Actions */}
            <UserEmailActions
                userId={user.id}
                initialWelcomeSent={user.welcomeEmailSent}
                initialNudgeCount={user.nudgeCount}
            />

            {/* Documents Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Documents ({user.documents.length})</h2>
                <div className="rounded-xl border border-white/5 overflow-hidden">
                    <table className="w-full text-left bg-[#141416]">
                        <thead className="bg-white/5 text-xs uppercase text-zinc-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Title</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Last Updated</th>
                                <th className="px-6 py-4 font-medium">Slug</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {user.documents.map(doc => (
                                <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium">{doc.title}</td>
                                    <td className="px-6 py-4">
                                        {doc.isPublished ? (
                                            <span className="text-green-400 text-xs bg-green-400/10 px-2 py-1 rounded">Published</span>
                                        ) : (
                                            <span className="text-zinc-500 text-xs bg-zinc-800 px-2 py-1 rounded">Draft</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400">
                                        {formatDistanceToNow(new Date(doc.updatedAt))} ago
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                                        {doc.publicSlug || '-'}
                                    </td>
                                </tr>
                            ))}
                            {user.documents.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                                        No documents created yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function Card({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="bg-[#141416] border border-white/5 rounded-xl p-6">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">{title}</h3>
            {children}
        </div>
    );
}

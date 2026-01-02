import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from 'next';
import { PublicDocLayout } from "@/components/PublicDocLayout";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const doc = await db.document.findUnique({
        where: { publicSlug: slug, isPublished: true },
    });

    if (!doc) return { title: 'Not Found' };

    return {
        title: `${doc.title} - SuperDocs`,
        description: `Read the official documentation for ${doc.repoName || 'this project'} on SuperDocs.`,
        openGraph: {
            title: doc.title,
            description: `Comprehensive documentation for ${doc.repoName || 'Project'}`,
            type: 'article',
            publishedTime: doc.createdAt.toISOString(),
            authors: ['SuperDocs AI'],
        }
    }
}

export default async function PublicDocPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const doc = await db.document.findUnique({
        where: { publicSlug: slug, isPublished: true },
    });

    if (!doc) return notFound();

    // Fetch siblings (same repo, same user, published)
    let siblings: any[] = [];
    if (doc.repoName) {
        siblings = await db.document.findMany({
            where: {
                userId: doc.userId,
                repoName: doc.repoName,
                isPublished: true,
            },
            select: {
                title: true,
                publicSlug: true,
                id: true,
                category: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
    }

    // Group siblings by category
    const groupedSiblings: { [key: string]: any[] } = {};
    siblings.forEach(s => {
        const cat = s.category || "General";
        if (!groupedSiblings[cat]) groupedSiblings[cat] = [];
        groupedSiblings[cat].push(s);
    });

    const categories = Object.keys(groupedSiblings);

    return (
        <PublicDocLayout
            doc={doc}
            categories={categories}
            groupedSiblings={groupedSiblings}
            siblings={siblings}
            slug={slug}
        />
    );
}

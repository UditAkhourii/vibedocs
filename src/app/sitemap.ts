import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://superdocs.dev';

    let documentEntries: MetadataRoute.Sitemap = [];

    try {
        // Get all published documents
        const documents = await db.document.findMany({
            where: {
                isPublished: true,
            },
            select: {
                publicSlug: true,
                updatedAt: true,
            },
        });

        documentEntries = documents.map((doc) => ({
            url: `${baseUrl}/p/${doc.publicSlug}`,
            lastModified: doc.updatedAt,
            changeFrequency: 'weekly',
            priority: 0.8,
        }));
    } catch (error) {
        console.error("Failed to fetch documents for sitemap:", error);
    }

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/explore`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        ...documentEntries,
    ];
}

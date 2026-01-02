import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { documentId, repoName, categories, customSlug } = await request.json();

        if (!documentId && !repoName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify ownership
        const dbUser = await db.user.findUnique({
            where: { authId: user.id },
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        let targetDocId = documentId;
        let mainSlug = "";

        if (repoName) {
            // Publish ALL docs for this repo
            const docs = await db.document.findMany({
                where: { userId: dbUser.id, repoName: repoName }
            });

            if (docs.length === 0) return NextResponse.json({ error: 'No documents found' }, { status: 404 });

            // Process all docs
            await Promise.all(docs.map(async (d) => {
                let slug = d.publicSlug;

                // Update slug if customSlug provided for this specific doc
                if (d.id === documentId && customSlug) {
                    slug = customSlug;
                }

                if (!slug) {
                    const safeTitle = d.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                    const random = randomBytes(4).toString('hex');
                    slug = `${safeTitle}-${random}`;
                }

                // Prepare update data
                const updateData: any = { isPublished: true, publicSlug: slug };

                // If categories map provided, update category
                if (categories && categories[d.id]) {
                    updateData.category = categories[d.id];
                }

                await db.document.update({
                    where: { id: d.id },
                    data: updateData
                });

                // If this is the specific doc the user was on, or the first doc, save it for the redirect
                if (d.id === documentId || (!targetDocId && !mainSlug)) {
                    mainSlug = slug;
                }
            }));

            // Fallback if mainSlug wasn't set
            if (!mainSlug && docs.length > 0) {
                const firstDoc = await db.document.findUnique({ where: { id: docs[0].id } });
                mainSlug = firstDoc?.publicSlug || "";
            }

        } else {
            // Single Document Publish (Legacy/Fallback)
            const doc = await db.document.findUnique({ where: { id: documentId } });
            if (!doc || doc.userId !== dbUser.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

            let slug = doc.publicSlug;

            if (customSlug) {
                slug = customSlug;
            }

            if (!slug) {
                const safeTitle = doc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                const random = randomBytes(4).toString('hex');
                slug = `${safeTitle}-${random}`;
            }

            await db.document.update({
                where: { id: documentId },
                data: { isPublished: true, publicSlug: slug }
            });
            mainSlug = slug;
        }

        return NextResponse.json({
            success: true,
            publicUrl: `/p/${mainSlug}`,
            slug: mainSlug
        });

    } catch (error: any) {
        console.error('Publish failed:', error);
        // Handle unique constraint violation for slug
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'This Permalink is already taken. Please try another one.' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Failed to publish' }, { status: 500 });
    }
}

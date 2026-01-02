import { NextResponse } from 'next/server';
import { generatePageContent } from '@/lib/gemini';
import { db } from '@/lib/db';
import { validateApiKey } from '@/lib/auth/api-key';

export async function POST(request: Request) {
    try {
        const { apiKey, pageTitle, sectionDescription, context, repoName } = await request.json();

        const user = await validateApiKey(apiKey);
        if (!user) {
            return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
        }

        if (!pageTitle || !context) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Generate Content
        const markdown = await generatePageContent(pageTitle, sectionDescription, context, repoName);

        // Update DB
        const existingDoc = await db.document.findFirst({
            where: {
                userId: user.id,
                repoName: repoName,
                title: pageTitle
            }
        });

        if (existingDoc) {
            await db.document.update({
                where: { id: existingDoc.id },
                data: {
                    content: markdown,
                    updatedAt: new Date()
                }
            });

            // Construct public link
            // Assuming localhost for dev, but should use env
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.superdocs.cloud';
            // If it has a public slug, use it, else generic viewer
            const link = `${baseUrl}/docs?repo=${encodeURIComponent(repoName)}&page=${existingDoc.id}`;

            return NextResponse.json({ success: true, documentId: existingDoc.id, link });
        } else {
            return NextResponse.json({ error: 'Document draft not found. Run plan first.' }, { status: 404 });
        }

    } catch (error: any) {
        console.error('CLI Content failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

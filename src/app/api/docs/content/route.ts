import { NextResponse } from 'next/server';
import { generatePageContent } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { pageTitle, sectionDescription, deepContext, repoName } = await request.json();

        if (!pageTitle || !deepContext) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Generate just this page's content
        const markdown = await generatePageContent(pageTitle, sectionDescription, deepContext, repoName);

        // Ensure User Exists with Smart Sync
        let dbUser = await db.user.findUnique({ where: { authId: user.id } });

        if (!dbUser) {
            // Check by Email (Linking case)
            if (user.email) {
                dbUser = await db.user.findUnique({ where: { email: user.email } });
                if (dbUser) {
                    // Link to existing account
                    dbUser = await db.user.update({
                        where: { id: dbUser.id },
                        data: { authId: user.id }
                    });
                }
            }

            // Create if still not found
            if (!dbUser) {
                dbUser = await db.user.create({
                    data: {
                        authId: user.id,
                        email: user.email,
                    },
                });
            }
        }

        // Save generated doc
        // Update or Create Document
        let savedDoc;
        const existingDoc = await db.document.findFirst({
            where: {
                userId: dbUser.id,
                repoName: repoName,
                title: pageTitle
            }
        });

        if (existingDoc) {
            savedDoc = await db.document.update({
                where: { id: existingDoc.id },
                data: {
                    content: markdown,
                    updatedAt: new Date()
                }
            });
        } else {
            savedDoc = await db.document.create({
                data: {
                    title: pageTitle,
                    content: markdown,
                    userId: dbUser.id,
                    isPublished: false,
                    repoName: repoName,
                }
            });
        }

        return NextResponse.json({ success: true, content: markdown, documentId: savedDoc.id });

    } catch (error: any) {
        console.error('Page content generation failed:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate content' }, { status: 500 });
    }
}

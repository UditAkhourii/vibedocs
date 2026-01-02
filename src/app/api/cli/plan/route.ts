import { NextResponse } from 'next/server';
import { generateDocsStructure } from '@/lib/gemini';
import { db } from '@/lib/db';
import { validateApiKey } from '@/lib/auth/api-key';

export async function POST(request: Request) {
    try {
        const { apiKey, repoName, files, packageJson } = await request.json();

        const user = await validateApiKey(apiKey);
        if (!user) {
            return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
        }

        // Construct context from files
        let deepContext = "";
        if (files && Array.isArray(files)) {
            for (const file of files) {
                const truncatedContent = file.content.length > 5000 ? file.content.substring(0, 5000) + "\n...[TRUNCATED]" : file.content;
                deepContext += `\n--- FILE: ${file.path} ---\n${truncatedContent}\n`;
            }
        }

        // Generate Plan
        // Use repoName as metadata name
        const treeString = files.map((f: any) => f.path).join('\n');

        // Mock Gemini call if needed, or real one
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'Server missing Gemini Key' }, { status: 500 });
        }

        const docsStructure = await generateDocsStructure(repoName, treeString, packageJson || "", deepContext);

        // Save Drafts
        const savedDocs = await Promise.all(docsStructure.map(async (doc) => {
            const potentialDocs = await db.document.findMany({
                where: { userId: user.id, title: doc.title }
            });

            // Check match by repoName AND title
            let dbDoc = potentialDocs.find(d => d.repoName === repoName);

            if (!dbDoc) {
                dbDoc = await db.document.create({
                    data: {
                        userId: user.id,
                        repoName: repoName,
                        title: doc.title,
                        category: doc.category,
                        content: "",
                        isPublished: false
                    }
                });
            } else {
                dbDoc = await db.document.update({
                    where: { id: dbDoc.id },
                    data: { category: doc.category, title: doc.title }
                });
            }
            return { ...doc, documentId: dbDoc.id };
        }));

        return NextResponse.json({
            success: true,
            docs: savedDocs,
            context: deepContext,
            projectId: repoName // Use repoName as ID for now
        });

    } catch (error: any) {
        console.error('CLI Plan failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

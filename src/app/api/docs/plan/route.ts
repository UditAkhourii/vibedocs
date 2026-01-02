import { NextResponse } from 'next/server';
import { GitHubConnector } from '@/lib/connectors/github';
import { generateDocsStructure } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { repoUrl, intent } = await request.json(); // intent: 'new' | 'open'

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let savedDocs: any[] = [];
        let deepContext = "";

        // 0. Pre-check: Optimize by checking DB before reaching out to GitHub
        // SKIP this if intent is explicitly 'new' (user wants to re-generate/start over)
        if (intent !== 'new') {
            let potentialNames: string[] = [];
            // Try to extract repo name from URL
            try {
                const urlParts = repoUrl.split('github.com/');
                if (urlParts.length > 1) {
                    const cleanPath = urlParts[1].replace('.git', '').replace(/\/$/, '');
                    potentialNames.push(cleanPath); // "owner/repo"
                    if (cleanPath.includes('/')) {
                        potentialNames.push(cleanPath.split('/')[1]); // "repo"
                    }
                } else {
                    potentialNames.push(repoUrl); // Maybe they passed just the name
                }
            } catch (e) { }

            if (user && potentialNames.length > 0) {
                const dbUser = await db.user.findUnique({ where: { authId: user.id } });
                if (dbUser) {
                    const allDocs = await db.document.findMany({
                        where: { userId: dbUser.id },
                        orderBy: { createdAt: 'asc' }
                    });

                    // Try to find a match for any potential name
                    for (const name of potentialNames) {
                        const matches = allDocs.filter(d => d.repoName === name);
                        if (matches.length > 0) {
                            savedDocs = matches.map(d => ({
                                id: d.id,
                                title: d.title,
                                category: d.category || "Project Docs",
                                description: "Existing documentation",
                                content: d.content,
                                documentId: d.id,
                                isPublished: d.isPublished,
                                publicSlug: d.publicSlug
                            }));
                            // Set the matched name for metadata consistency
                            // We mock metadata here since we skipped connection
                            if (savedDocs.length > 0) {
                                return NextResponse.json({
                                    success: true,
                                    docs: savedDocs,
                                    context: "", // No context needed for hydrated docs
                                    metadata: { name: name, id: name }
                                });
                            }
                        }
                    }
                }
            }
        }

        // 1. Connect to GitHub (Only if not found in DB)
        const connector = new GitHubConnector();
        const metadata = await connector.connect({ repoUrl, token: process.env.GITHUB_TOKEN });

        // Check for existing docs in DB (This block is now redundant if the above pre-check works,
        // but kept for cases where repoName might not be easily parsed or for future robustness)
        // If the pre-check returned, we wouldn't reach here.
        // If the pre-check didn't find anything, we proceed with GitHub connection.
        // Now we use the actual metadata.name from GitHub.
        // Check for existing docs in DB (This block is now redundant if the above pre-check works,
        // but kept for cases where repoName might not be easily parsed or for future robustness)
        // CRITICAL: If intent is 'new', we MUST skip this lookup to force regeneration.
        if (user && intent !== 'new') {
            const dbUser = await db.user.findUnique({ where: { authId: user.id } });
            if (dbUser) {
                // We filter by repoName in memory to avoid stale Prisma Client issues on the dev server if any
                const allDocs = await db.document.findMany({
                    where: { userId: dbUser.id },
                    orderBy: { createdAt: 'asc' }
                });
                savedDocs = allDocs.filter(d => d.repoName === metadata.name).map(d => ({
                    id: d.id, // Using DB ID as page ID
                    title: d.title,
                    category: d.category || "Project Docs",
                    description: "Existing documentation",
                    content: d.content,
                    documentId: d.id,
                    isPublished: d.isPublished,
                    publicSlug: d.publicSlug
                }));
            }
        }

        if (savedDocs.length > 0) {
            // Found existing docs!
            // Only perform deep scan if we have empty content (drafts) that need generation
            const hasDrafts = savedDocs.some(d => !d.content || d.content.trim() === "");

            if (hasDrafts) {
                // We need context for the drafts
                const treeString = await connector.getTreeString();
                const importantFiles = await connector.getMostImportantFiles();
                for (const file of importantFiles) {
                    try {
                        const content = await connector.getFileContent(file.path);
                        const truncatedContent = content.length > 5000 ? content.substring(0, 5000) + "\n...[TRUNCATED]" : content;
                        deepContext += `\n--- FILE: ${file.path} ---\n${truncatedContent}\n`;
                    } catch (e) {
                        console.warn(`Failed to fetch content for ${file.path}`, e);
                    }
                }
            } else {
                console.log("Restoring fully generated docs from DB.");
            }

            return NextResponse.json({
                success: true,
                docs: savedDocs,
                context: deepContext,
                metadata: metadata
            });
        }

        // 2. Deep Scan (If no existing docs)
        // We'll pass the whole file tree and content to Gemini
        const treeString = await connector.getTreeString();
        const importantFiles = await connector.getMostImportantFiles();

        for (const file of importantFiles) {
            try {
                const content = await connector.getFileContent(file.path);
                // Truncate individual files to avoid blowout
                const truncatedContent = content.length > 5000 ? content.substring(0, 5000) + "\n...[TRUNCATED]" : content;
                deepContext += `\n--- FILE: ${file.path} ---\n${truncatedContent}\n`;
            } catch (e) {
                console.warn(`Failed to fetch content for ${file.path}`, e);
            }
        }

        // Add README if available
        try {
            const readme = await connector.getFileContent('README.md');
            deepContext = `--- README.md ---\n${readme.substring(0, 3000)}\n` + deepContext;
        } catch (e) { }

        // Add Package.json if available
        let packageJson = "";
        try {
            packageJson = await connector.getFileContent('package.json');
        } catch (e) { }


        // 3. Generate Documentation Plan (Structure Only)
        if (!process.env.GEMINI_API_KEY) {
            // Mock response
            return NextResponse.json({
                success: true,
                docs: [
                    { id: "intro", title: "Introduction", category: "Getting Started", description: "Project overview" },
                    { id: "arch", title: "Architecture", category: "Architecture", description: "System design" }
                ],
                context: "Mock Context"
            });
        }

        const docsStructure = await generateDocsStructure(metadata.name, treeString, packageJson, deepContext);

        // 4. Save Drafts to Database (so they appear in dashboard immediately)
        // supabase and user are already defined above

        savedDocs = docsStructure;

        if (user) {
            // Ensure User Exists
            // Ensure User Exists with Smart Sync
            // 1. Check by Auth ID (Standard case)
            let dbUser = await db.user.findUnique({ where: { authId: user.id } });

            if (!dbUser) {
                // 2. Check by Email (Linking case for seeded accounts)
                if (user.email) {
                    dbUser = await db.user.findUnique({ where: { email: user.email } });
                    if (dbUser) {
                        // Link the real Auth ID to the existing account
                        dbUser = await db.user.update({
                            where: { id: dbUser.id },
                            data: { authId: user.id }
                        });
                    }
                }

                // 3. Create if still not found
                if (!dbUser) {
                    dbUser = await db.user.create({
                        data: { authId: user.id, email: user.email || "" }
                    });
                }
            }

            // Save placeholders
            savedDocs = await Promise.all(docsStructure.map(async (doc) => {
                // Manual Find & Update/Create
                // Fetch potential matches first (filtering by user and title)
                // We filter by repoName in memory to avoid stale Prisma Client issues on the dev server
                const potentialDocs = await db.document.findMany({
                    where: { userId: dbUser.id, title: doc.title }
                });

                // Use metadata.id (owner/repo) if it looks improved, else fall back to metadata.name
                const canonicalName = metadata.id && metadata.id.includes('/') ? metadata.id : metadata.name;

                let dbDoc = potentialDocs.find(d => d.repoName === canonicalName);

                // Fallback: Check if we have a draft with the short name and upgrade it?
                // Actually the migration script handles existing data.
                // New data should simple use canonicalName.

                if (!dbDoc) {
                    dbDoc = await db.document.create({
                        data: {
                            userId: dbUser.id,
                            repoName: canonicalName,
                            title: doc.title,
                            category: doc.category,
                            content: "", // Empty content for draft
                            isPublished: false
                        }
                    });
                } else {
                    // CRITICAL FIX: If we are re-generating (getting a new plan), we MUST update the existing record
                    // to reflect the new AI-improved category/title. Otherwise, we're stuck with the old "bad" structure forever.
                    dbDoc = await db.document.update({
                        where: { id: dbDoc.id },
                        data: {
                            category: doc.category,
                            // Optionally update title if changed slightly, but category is the main fix needed
                            title: doc.title
                        }
                    });
                }

                return { ...doc, documentId: dbDoc.id };
            }));
        }

        // Return Structure + Context (so frontend can pass context back for page generation)
        return NextResponse.json({
            success: true,
            docs: savedDocs,
            context: deepContext,
            metadata: metadata
        });

    } catch (error: any) {
        console.error('Doc Plan generation failed:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate documentation plan' }, { status: 500 });
    }
}

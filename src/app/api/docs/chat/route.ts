
import { streamChatContext } from '@/lib/gemini';
import { db } from '@/lib/db';

export const runtime = 'nodejs'; // Use node runtime for stream support if needed, though edge usually preferred for streaming. Next.js App Router defaults to Node.

export async function POST(req: Request) {
    try {
        const { messages, documentId } = await req.json();

        if (!messages || !documentId) {
            return new Response("Missing messages or documentId", { status: 400 });
        }

        // 1. Get current document to identify repo and user
        const currentDoc = await db.document.findUnique({
            where: { id: documentId },
            select: { repoName: true, userId: true }
        });

        if (!currentDoc || !currentDoc.repoName) {
            return new Response("Document Context Not Found", { status: 404 });
        }

        // 2. Fetch all published context for this repository
        const repoDocs = await db.document.findMany({
            where: {
                userId: currentDoc.userId,
                repoName: currentDoc.repoName,
                isPublished: true,
            },
            select: {
                title: true,
                category: true,
                content: true
            }
        });

        // 3. Construct Context String
        let fullContext = `DOCUMENTATION FOR: ${currentDoc.repoName}\n\n`;

        repoDocs.forEach(doc => {
            fullContext += `--- SECTION: ${doc.title} (${doc.category}) ---\n${doc.content}\n\n`;
        });

        // Limit context size to be safe (Gemini Flash 2.0 is 1M, but let's be safe with 500k chars for now)
        if (fullContext.length > 500000) {
            fullContext = fullContext.substring(0, 500000) + "\n...(truncated)...";
        }

        // 4. Get the last message as the query
        const lastMessage = messages[messages.length - 1];
        const query = lastMessage.parts || lastMessage.content || ""; // Adjust based on frontend message format

        // 5. Stream Response
        // 5. Stream Response
        // Filter out initial model messages (like greetings) to satisfy Gemini API requirements
        // History must start with a user message if present.
        let history = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: m.content || m.parts
        }));

        // Remove leading model messages until we find a user message
        while (history.length > 0 && history[0].role === 'model') {
            history.shift();
        }

        console.log("Chat Debug - History Length after filter:", history.length);

        const stream = await streamChatContext(
            history,
            fullContext,
            query
        );

        // Convert Gemini stream to Response stream
        // Using a ReadableStream to pipe chunks
        const readableStream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                for await (const chunk of stream) {
                    const text = chunk.text();
                    controller.enqueue(encoder.encode(text));
                }
                controller.close();
            }
        });

        return new Response(readableStream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });

    } catch (error: any) {
        console.error("Chat Error:", error);
        return new Response(`Error: ${error.message}`, { status: 500 });
    }
}

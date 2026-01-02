import { db } from "@/lib/db";

export async function validateApiKey(apiKey: string | null) {
    if (!apiKey) return null;

    const keyRecord = await db.apiKey.findUnique({
        where: { key: apiKey },
        include: { user: true }
    });

    if (!keyRecord) return null;

    // Optional: Update lastUsed
    await db.apiKey.update({
        where: { id: keyRecord.id },
        data: { lastUsed: new Date() }
    });

    return keyRecord.user;
}

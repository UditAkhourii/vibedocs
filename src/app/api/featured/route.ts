import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const featuredDocs = await db.document.findMany({
            where: {
                isPublished: true,
            },
            orderBy: {
                updatedAt: 'desc'
            },
            distinct: ['repoName'],
            take: 8 // 2 rows of 4
        });

        return NextResponse.json(featuredDocs);
    } catch (error) {
        console.error("Error fetching featured docs:", error);
        return NextResponse.json({ error: "Failed to fetch featured docs" }, { status: 500 });
    }
}

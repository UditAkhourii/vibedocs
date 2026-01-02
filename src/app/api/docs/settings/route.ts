import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const repoName = searchParams.get('repoName');

    if (!user || (!id && !repoName)) {
        return new NextResponse("Unauthorized or Missing ID/Repo", { status: 400 });
    }

    try {
        const dbUser = await db.user.findUnique({ where: { authId: user.id } });
        if (!dbUser) return new NextResponse("User not found", { status: 404 });

        if (repoName) {
            // Delete entire project
            await db.document.deleteMany({
                where: {
                    userId: dbUser.id,
                    repoName: repoName
                }
            });
        } else if (id) {
            // Delete single doc
            const doc = await db.document.findUnique({ where: { id } });
            if (!doc || doc.userId !== dbUser.id) {
                return new NextResponse("Document not found or access denied", { status: 403 });
            }
            await db.document.delete({ where: { id } });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete failed:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const body = await req.json();

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const dbUser = await db.user.findUnique({ where: { authId: user.id } });
        if (!dbUser) return new NextResponse("User not found", { status: 404 });

        const { id, repoName, isDiscoverable } = body;

        if (repoName) {
            // Update entire project visibility
            await db.document.updateMany({
                where: {
                    userId: dbUser.id,
                    repoName: repoName
                },
                data: { isDiscoverable }
            });
            return NextResponse.json({ success: true, count: 'all' });
        } else if (id) {
            // Update single doc
            const doc = await db.document.findUnique({ where: { id } });
            if (!doc || doc.userId !== dbUser.id) {
                return new NextResponse("Document not found or access denied", { status: 403 });
            }

            const updated = await db.document.update({
                where: { id },
                data: { isDiscoverable }
            });
            return NextResponse.json(updated);
        }

        return NextResponse.json({ error: "Missing id or repoName" }, { status: 400 });

    } catch (error) {
        console.error("Update settings failed:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

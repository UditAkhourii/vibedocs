import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { db } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const dbUser = await db.user.findUnique({
            where: { authId: user.id }
        });

        if (!dbUser || dbUser.role !== 'admin') {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { userId } = await req.json();

        if (!userId) {
            return new NextResponse("User ID required", { status: 400 });
        }

        // 1. Get the user to find their authId
        const targetUser = await db.user.findUnique({
            where: { id: userId }
        });

        if (!targetUser) {
            return new NextResponse("User not found", { status: 404 });
        }

        // 2. Delete from Supabase Auth
        const supabaseAdmin = createAdminClient();
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(targetUser.authId);

        if (deleteAuthError) {
            console.error("Failed to delete user from Supabase Auth:", deleteAuthError);
            return new NextResponse("Failed to delete user auth", { status: 500 });
        }

        // 3. Delete from Prisma (Cascading will handle docs usually, but we haven't set onDelete: Cascade on Document->User relation)
        // Let's check relation. Document has `user User @relation(...)`. No onDelete specified means Restrict or SetNull.
        // We should delete documents first.

        await db.document.deleteMany({
            where: { userId: userId }
        });

        // Delete API keys (Calculated for onDelete: Cascade)
        // await db.apiKey.deleteMany({ where: { userId: userId }}); // Handled by Prisma schema

        // Finally delete user
        await db.user.delete({
            where: { id: userId }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("[ADMIN_DELETE_USER]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

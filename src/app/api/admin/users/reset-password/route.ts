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

        const { userId, newPassword } = await req.json();

        if (!userId || !newPassword) {
            return new NextResponse("User ID and new password required", { status: 400 });
        }

        if (newPassword.length < 6) {
            return new NextResponse("Password must be at least 6 characters", { status: 400 });
        }

        // 1. Get the user to find their authId
        const targetUser = await db.user.findUnique({
            where: { id: userId }
        });

        if (!targetUser) {
            return new NextResponse("User not found", { status: 404 });
        }

        // 2. Update password in Supabase Auth
        const supabaseAdmin = createAdminClient();
        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
            targetUser.authId,
            { password: newPassword }
        );

        if (updateAuthError) {
            console.error("Failed to update user password in Supabase Auth:", updateAuthError);
            return new NextResponse("Failed to update password: " + updateAuthError.message, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("[ADMIN_RESET_PASSWORD]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

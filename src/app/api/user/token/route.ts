import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { token } = await req.json();

        if (!token) {
            return new NextResponse("Token required", { status: 400 });
        }

        // We use update here assuming the user is already created via webhook or prior logic.
        // If not, we might need upsert? But user should exist if authenticated.
        // Upsert is safer for initial login race conditions

        await db.user.upsert({
            where: { authId: user.id },
            update: { githubAccessToken: token },
            create: {
                authId: user.id,
                email: user.email!,
                githubAccessToken: token
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save token", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

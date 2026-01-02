import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from 'crypto';

export async function GET(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const dbUser = await db.user.findUnique({
            where: { authId: user.id },
            include: { apiKeys: true }
        });

        if (!dbUser) {
            return new NextResponse("User not found", { status: 404 });
        }

        return NextResponse.json({ keys: dbUser.apiKeys });
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { name } = await req.json();

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const dbUser = await db.user.findUnique({ where: { authId: user.id } });
        if (!dbUser) return new NextResponse("User not found", { status: 404 });

        // Generate a secure key: sd_ + 32 random hex chars
        const key = `sd_${crypto.randomBytes(16).toString('hex')}`;

        const newKey = await db.apiKey.create({
            data: {
                key,
                name: name || "CLI Token",
                userId: dbUser.id
            }
        });

        return NextResponse.json(newKey);
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!user || !id) {
        return new NextResponse("Unauthorized or Missing ID", { status: 400 });
    }

    try {
        const dbUser = await db.user.findUnique({ where: { authId: user.id } });
        if (!dbUser) return new NextResponse("User not found", { status: 404 });

        await db.apiKey.delete({
            where: {
                id,
                userId: dbUser.id // Ensure ownership
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

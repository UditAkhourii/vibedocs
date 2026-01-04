
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { email, secret } = await req.json();

        // Simple hardcoded check for safety
        if (secret !== process.env.DATABASE_URL?.substring(0, 10)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const adminEmail = process.env.ADMIN_EMAIL || "udit@superdocs.cloud";
        if (email !== adminEmail) {
            return NextResponse.json({ error: "Invalid admin email" }, { status: 400 });
        }

        const user = await db.user.upsert({
            where: { email },
            update: { role: 'admin' },
            create: {
                email,
                authId: 'seeded-admin-' + Date.now(), // Placeholder authId for seeding if user hasn't signed up
                role: 'admin'
            }
        });

        return NextResponse.json({ success: true, user });
    } catch (e: any) {
        console.error("SEED ERROR:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

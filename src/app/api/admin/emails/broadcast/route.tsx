
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import BroadcastEmail from '@/lib/email/templates/BroadcastEmail';

export async function POST(request: Request) {
    try {
        // 1. Check Admin Auth
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminUser = await db.user.findUnique({
            where: { authId: authUser.id }
        });

        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Parse Body
        const { subject, message } = await request.json();

        if (!subject || !message) {
            return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
        }

        // 3. Fetch All Users
        const allUsers = await db.user.findMany({
            where: { email: { not: undefined } },
            select: { id: true, email: true }
        });

        console.log(`Starting broadcast '${subject}' to ${allUsers.length} users...`);

        let sentCount = 0;
        const failedEmails: string[] = [];
        const successfulUserIds: string[] = [];

        // 4. Send Emails (Sequential to be safe with SMTP limits)
        for (const user of allUsers) {
            if (!user.email) continue;

            const result = await sendEmail({
                to: user.email,
                subject,
                react: <BroadcastEmail subject={subject} content={message} />
            });

            if (result.success) {
                sentCount++;
                successfulUserIds.push(user.id);
            } else {
                failedEmails.push(user.email);
            }

            // Small delay to prevent SMTP rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Batch update all successful sends
        if (successfulUserIds.length > 0) {
            await db.$executeRaw`
                UPDATE "User" 
                SET "lastEmailedAt" = NOW() 
                WHERE id = ANY(${successfulUserIds}::uuid[])
            `;
        }

        return NextResponse.json({
            success: true,
            total: allUsers.length,
            sent: sentCount,
            failed: failedEmails.length,
            failedEmails // Only useful for small scale debugging
        });

    } catch (error: any) {
        console.error('Broadcast Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

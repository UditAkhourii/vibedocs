import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import WelcomeEmail from '@/lib/email/templates/WelcomeEmail';
import NudgeEmail from '@/lib/email/templates/NudgeEmail';

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
        const { userId, type } = await request.json();

        if (!userId || !type) {
            return NextResponse.json({ error: 'Missing requirements' }, { status: 400 });
        }

        const targetUser = await db.user.findUnique({ where: { id: userId } });
        if (!targetUser || !targetUser.email) {
            return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
        }

        // 3. Send Email based on Type
        let success = false;
        let updateData = {};
        let errorDetails: any = null; // Captured error from sendEmail

        if (type === 'welcome') {
            const result = await sendEmail({
                to: targetUser.email,
                subject: 'Welcome to SuperDocs! 🚀',
                react: <WelcomeEmail userFirstName={targetUser.email.split('@')[0]} />
            });
            success = !!result.success;
            if (success) {
                updateData = { welcomeEmailSent: true, lastEmailedAt: new Date() };
            } else {
                errorDetails = result.error;
            }

        } else if (type.startsWith('nudge')) {
            const stage = parseInt(type.replace('nudge-', ''));
            const result = await sendEmail({
                to: targetUser.email,
                subject: stage === 1 ? 'Needs help?' : stage === 2 ? 'SuperDocs Pro Tip' : 'One last thing...',
                react: <NudgeEmail type={stage} />
            });
            success = !!result.success;
            if (success) {
                updateData = { nudgeCount: stage, lastEmailedAt: new Date() };
            } else {
                errorDetails = result.error;
            }
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        // 4. Update Database
        if (success) {
            await db.user.update({
                where: { id: targetUser.id },
                data: updateData
            });
            return NextResponse.json({ success: true });
        } else {
            console.error('Send Email Failed:', errorDetails);
            // Format existing error to be string-safe
            let errorMessage = 'Failed to send email';
            if (errorDetails) {
                if (typeof errorDetails === 'string') errorMessage = errorDetails;
                else if (errorDetails.message) errorMessage = errorDetails.message;
                else errorMessage = JSON.stringify(errorDetails);
            }

            return NextResponse.json({
                error: errorMessage
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Admin Email Send Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

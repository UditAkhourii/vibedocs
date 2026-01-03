import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import WelcomeEmail from '@/lib/email/templates/WelcomeEmail';

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ideally, we check db.User status
        const dbUser = await db.user.findUnique({
            where: { authId: user.id }
        });

        if (!dbUser) {
            // User might need sync, but we can't email if we don't have them in DB? 
            // Actually we have email from Auth, but we track state in DB.
            return NextResponse.json({ error: 'User not synced' }, { status: 404 });
        }

        if (dbUser.welcomeEmailSent) {
            return NextResponse.json({ alreadySent: true });
        }

        const { success } = await sendEmail({
            to: user.email,
            subject: 'Welcome to SuperDocs! 🚀',
            react: <WelcomeEmail userFirstName={ user.email.split('@')[0] } />
        });

    if (success) {
        await db.user.update({
            where: { id: dbUser.id },
            data: { welcomeEmailSent: true, lastEmailedAt: new Date() }
        });
    }

    return NextResponse.json({ success });

} catch (error) {
    console.error('Welcome Email Trigger Failed:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
}
}

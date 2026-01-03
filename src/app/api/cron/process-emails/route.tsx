import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import WelcomeEmail from '@/lib/email/templates/WelcomeEmail';
import NudgeEmail from '@/lib/email/templates/NudgeEmail';

/*
  CRON JOB - Recommended schedule: Every hour
*/
export async function GET(request: Request) {
    // Basic security check (use CRON_SECRET in production)
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

    const log = { welcomed: 0, nudged: 0 };

    /* 
      1. WELCOME EMAIL FALLBACK (Safety Net)
      Catch users created > 10 mins ago who still haven't received welcome email.
      (Prioritize API trigger, but this catches failures)
    */
    const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const newUsers = await db.user.findMany({
        where: {
            welcomeEmailSent: false,
            createdAt: { lt: tenMinsAgo },
            email: { contains: '@' } // Basic validity
        },
        take: 50 // Batch size
    });

    for (const user of newUsers) {
        const { success } = await sendEmail({
            to: user.email,
            subject: 'Welcome to SuperDocs! 🚀',
            react: <WelcomeEmail userFirstName={ user.email.split('@')[0] } />
        });

    if (success) {
        await db.user.update({
            where: { id: user.id },
            data: { welcomeEmailSent: true, lastEmailedAt: new Date() }
        });
        log.welcomed++;
    }
}

/*
  2. STATIC USER NUDGES (24h, 48h, 72h)
  Status: No published docs.
*/

// Nudge 1: 24h - 48h after signup, no docs, nudgeCount 0
const staticStage1 = await db.user.findMany({
    where: {
        welcomeEmailSent: true,
        nudgeCount: 0,
        createdAt: { lt: oneDayAgo },
        documents: { none: {} }, // Strictly no docs created at all
    },
    take: 50
});

for (const user of staticStage1) {
    const { success } = await sendEmail({
        to: user.email,
        subject: 'Quick question...',
        react: <NudgeEmail type={ 1} />
        });
if (success) {
    await db.user.update({
        where: { id: user.id },
        data: { nudgeCount: 1, lastEmailedAt: new Date() }
    });
    log.nudged++;
}
    }

// Nudge 2: 48h after signup, nudgeCount 1
const staticStage2 = await db.user.findMany({
    where: {
        nudgeCount: 1,
        createdAt: { lt: twoDaysAgo },
        documents: { none: {} }
    },
    take: 50
});

for (const user of staticStage2) {
    const { success } = await sendEmail({
        to: user.email,
        subject: 'SuperDocs Pro Tip 💡',
        react: <NudgeEmail type={ 2} />
        });
if (success) {
    await db.user.update({
        where: { id: user.id },
        data: { nudgeCount: 2, lastEmailedAt: new Date() }
    });
    log.nudged++;
}
    }

// Nudge 3: 72h after signup, nudgeCount 2
const staticStage3 = await db.user.findMany({
    where: {
        nudgeCount: 2,
        createdAt: { lt: threeDaysAgo },
        documents: { none: {} }
    },
    take: 50
});

for (const user of staticStage3) {
    const { success } = await sendEmail({
        to: user.email,
        subject: 'One last thing...',
        react: <NudgeEmail type={ 3} />
        });
if (success) {
    await db.user.update({
        where: { id: user.id },
        data: { nudgeCount: 3, lastEmailedAt: new Date() }
    });
    log.nudged++;
}
    }

return NextResponse.json({ success: true, log });
}

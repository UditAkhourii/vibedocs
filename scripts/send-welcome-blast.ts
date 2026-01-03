
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import WelcomeEmail from "@/lib/email/templates/WelcomeEmail";
import React from "react";

async function main() {
    console.log("🚀 Starting Bulk Welcome Email Blast...");

    // 1. Fetch users who haven't received the welcome email
    // Since we just added the column, most users will be false.
    const users = await db.user.findMany({
        where: {
            welcomeEmailSent: false,
            email: { not: undefined } // Ensure email exists
        }
    });

    console.log(`found ${users.length} users pending welcome email.`);

    if (users.length === 0) {
        console.log("No pending users found. Exiting.");
        return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const [index, user] of users.entries()) {
        const email = user.email;
        const name = email.split('@')[0];

        try {
            console.log(`[${index + 1}/${users.length}] Sending to ${email}...`);

            const { success, error } = await sendEmail({
                to: email,
                subject: 'Welcome to SuperDocs! 🚀',
                react: React.createElement(WelcomeEmail, { userFirstName: name })
            });

            if (success) {
                await db.user.update({
                    where: { id: user.id },
                    data: { welcomeEmailSent: true, lastEmailedAt: new Date() }
                });
                console.log(`   ✅ Sent!`);
                successCount++;
            } else {
                console.error(`   ❌ Failed:`, error);
                failCount++;
            }

            // Small delay to be nice to SMTP server
            await new Promise(r => setTimeout(r, 500));

        } catch (e) {
            console.error(`   ❌ Critical Error for ${email}:`, e);
            failCount++;
        }
    }

    console.log("\n🏁 Blast Complete!");
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
}

main();

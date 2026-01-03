
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🔄 Starting User Sync...");

    try {
        // 1. Fetch ALL users from Auth schema (source of truth)
        // casting to any because raw query types are loose
        const authUsers: any[] = await prisma.$queryRawUnsafe(`
            SELECT id, email, created_at, raw_user_meta_data 
            FROM auth.users
        `);

        console.log(`Found ${authUsers.length} users in Auth system.`);

        let syncedCount = 0;
        let errorCount = 0;

        for (const authUser of authUsers) {
            try {
                // 2. Check/Upsert into Public User table
                /* 
                   We use upsert to be safe. 
                   If exists (match on authId or email), update nothing (or update meta).
                   If new, insert.
                */

                // Note: auth.users id is UUID. Our User.authId is String @unique.
                // We should ensure we map them correctly.

                await prisma.user.upsert({
                    where: {
                        authId: authUser.id
                    },
                    update: {
                        // Optional: Ensure email is sync if changed (rare)
                        email: authUser.email
                    },
                    create: {
                        authId: authUser.id,
                        email: authUser.email,
                        createdAt: new Date(authUser.created_at),
                        role: 'user', // Default role
                        welcomeEmailSent: false, // Assume false if we missed them
                        nudgeCount: 0
                    }
                });

                syncedCount++;
                // Print progress every 10 users
                if (syncedCount % 10 === 0) process.stdout.write('.');

            } catch (e: any) {
                console.error(`\n❌ Failed to sync ${authUser.email}: ${e.message}`);

                // Fallback: Try syncing by email if authId conflict failed
                // (Sometimes legacy data might have different constraint issues)
                try {
                    const existing = await prisma.user.findUnique({ where: { email: authUser.email } });
                    if (existing && existing.authId !== authUser.id) {
                        console.log(`   Detailed Conflict: Auth ID mismatch for ${authUser.email}. Updating...`);
                        await prisma.user.update({
                            where: { email: authUser.email },
                            data: { authId: authUser.id }
                        });
                        syncedCount++;
                    }
                } catch (e2) {
                    errorCount++;
                }
            }
        }

        console.log(`\n\n✅ Sync Complete!`);
        console.log(`Total Auth Users: ${authUsers.length}`);
        console.log(`Processed: ${syncedCount}`);
        console.log(`Errors: ${errorCount}`);

    } catch (e) {
        console.error("Critical Failure:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();


import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

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

        // 2. Fetch all users from Supabase (using Service Role to see everyone)
        // We need a SERVICE_ROLE client for this as regular admin client can't list all users easily
        // If SERVICE_ROLE key isn't available, we might be limited. 
        // fallback: We can only sync users who have logged in if we rely on on-the-fly.
        // BUT, we have Next.js, we can use the Service Role key if exposed essentially or 
        // actually, Supabase Auth Admin API requires service_role key.

        // Let's assume we might not have service role easily accessibly configured in code for client creation
        // but typically it is process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'Server misconfiguration: No Service Role Key' }, { status: 500 });
        }

        const { createClient: createServiceClient } = require('@supabase/supabase-js');
        const serviceClient = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const { data: { users: supabaseUsers }, error: fetchError } = await serviceClient.auth.admin.listUsers();

        if (fetchError || !supabaseUsers) {
            throw new Error(fetchError?.message || 'Failed to fetch Supabase users');
        }

        let syncedCount = 0;

        // 3. Upsert into Prisma
        for (const sbUser of supabaseUsers) {
            if (sbUser.email) {
                await db.user.upsert({
                    where: { email: sbUser.email },
                    update: {
                        authId: sbUser.id,
                        updatedAt: new Date()
                    },
                    create: {
                        authId: sbUser.id,
                        email: sbUser.email,
                        createdAt: new Date(sbUser.created_at)
                    }
                });
                syncedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${syncedCount} users from Supabase to DB.`
        });

    } catch (error: any) {
        console.error('Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

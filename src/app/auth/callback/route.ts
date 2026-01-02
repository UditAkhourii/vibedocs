import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

async function ensureUserExists(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email) {
        // 1. Check by Auth ID
        let dbUser = await db.user.findUnique({ where: { authId: user.id } });

        if (!dbUser) {
            // 2. Check by Email (Link seeded admins)
            dbUser = await db.user.findUnique({ where: { email: user.email } });
            if (dbUser) {
                await db.user.update({
                    where: { id: dbUser.id },
                    data: { authId: user.id }
                });
            } else {
                // 3. Create new user
                await db.user.create({
                    data: { authId: user.id, email: user.email }
                });
            }
        }
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const next = searchParams.get('next') ?? '/'

    const code = searchParams.get('code')

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            await ensureUserExists(supabase);
            // Forward to next or root
            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocal = process.env.NODE_ENV === 'development'

            // Determine redirect URL
            const redirectUrl = next === '/' ? '/?verified=true' : `${next}${next.includes('?') ? '&' : '?'}verified=true`;

            if (isLocal) {
                return NextResponse.redirect(`${request.nextUrl.origin}${redirectUrl}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${redirectUrl}`)
            } else {
                return NextResponse.redirect(`${request.nextUrl.origin}${redirectUrl}`)
            }
        }
    }

    if (token_hash && type) {
        const supabase = await createClient()

        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        })
        if (!error) {
            await ensureUserExists(supabase);
            const redirectUrl = next === '/' ? '/?verified=true' : `${next}${next.includes('?') ? '&' : '?'}verified=true`;
            return NextResponse.redirect(new URL(redirectUrl, request.url))
        }
    }

    // Check if Supabase sent an error directly
    const error_description = searchParams.get('error_description')
    if (error_description) {
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error_description)}`, request.url))
    }

    return NextResponse.redirect(new URL('/login?error=auth', request.url))
}

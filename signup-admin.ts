
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing SUPABASE env vars.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function signUp() {
    const email = 'udit@superdocs.cloud'
    const password = 'Udit@0072023'

    console.log(`Signing up ${email}...`)
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Successfully signed up! User ID:', data.user?.id)
        if (data.session) {
            console.log('Session established.')
        } else {
            console.log('Verification email might have been sent.')
        }
    }
}

signUp()

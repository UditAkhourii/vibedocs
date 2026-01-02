
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE env vars. NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updatePassword() {
    const email = 'udit@superdocs.cloud'
    const newPassword = 'Udit@0072023'

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
        console.error('Error listing users:', listError)
        return
    }

    const user = users.find(u => u.email === email)

    if (!user) {
        console.error(`User ${email} not found.`)
        return
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
    )

    if (updateError) {
        console.error('Error:', updateError)
    } else {
        console.log('Successfully updated password for', email)
    }
}

updatePassword()


import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL
        }
    }
})

async function checkUser() {
    const email = 'udit@superdocs.cloud'
    try {
        const users = await prisma.$queryRawUnsafe(`SELECT id, email FROM auth.users WHERE email = $1`, email)
        console.log('User found in auth.users:', users)
    } catch (e) {
        console.error('Failed to query auth.users. You might not have permission or schema is wrong:', e)
    } finally {
        await prisma.$disconnect()
    }
}

checkUser()

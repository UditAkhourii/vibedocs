
import { db } from './src/lib/db'

async function syncAdmin() {
    const email = 'udit@superdocs.cloud';
    const authId = 'bf8b0ad8-74d9-4ccc-8068-31ddf0e59666';

    const user = await db.user.findUnique({ where: { email } });

    if (user) {
        console.log('Current user record:', user);
        await db.user.update({
            where: { email },
            data: { authId, role: 'admin' }
        });
        console.log('Synchronized Auth ID and ensured Admin role.');
    } else {
        await db.user.create({
            data: { email, authId, role: 'admin' }
        });
        console.log('Created new Admin user record in Prisma.');
    }
}

syncAdmin()
    .catch(console.error)
    .finally(() => db.$disconnect());


import { db } from './src/lib/db';
import crypto from 'crypto';

async function main() {
    const email = 'udit@superdocs.cloud';
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
        console.error('User not found:', email);
        return;
    }

    const key = `sd_TEST_${crypto.randomBytes(8).toString('hex')}`;

    await db.apiKey.create({
        data: {
            key,
            name: 'Test Token',
            userId: user.id
        }
    });

    console.log('Generated Key:', key);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });

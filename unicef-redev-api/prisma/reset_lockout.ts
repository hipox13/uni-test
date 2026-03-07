import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const result = await prisma.uniUser.updateMany({
        where: { email: 'admin@unicef.org' },
        data: {
            logAttempts: 0,
            logTimeout: null
        }
    });
    console.log(`Reset lockout for ${result.count} user(s) matching admin@unicef.org`);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

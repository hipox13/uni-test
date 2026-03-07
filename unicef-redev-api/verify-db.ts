import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verify() {
    const refId = 'UNICEF-20260304191808-42246a5c';
    const tx = await prisma.uniTransaction.findUnique({
        where: { refId }
    });
    console.log('--- Database Verification ---');
    console.log('Ref ID:', tx?.refId);
    console.log('Next Schedule At:', tx?.nextScheduleAt);
    console.log('Current Time (UTC):', new Date().toISOString());
    process.exit(0);
}

verify();

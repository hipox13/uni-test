import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
    const refId = 'UNICEF-20260304191808-42246a5c';
    const nextSchedule = new Date();
    nextSchedule.setMinutes(nextSchedule.getMinutes() + 2); // Set it to 2 minutes from now

    await prisma.uniTransaction.update({
        where: { refId },
        data: { nextScheduleAt: nextSchedule }
    });

    console.log(`Updated ${refId}: nextScheduleAt set to ${nextSchedule.toISOString()}`);
    process.exit(0);
}

fix();

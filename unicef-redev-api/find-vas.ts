import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function findVAs() {
    const refId = 'UNICEF-20260304191808-42246a5c';
    const responses = await prisma.uniTransactionResponse.findMany({
        where: { refId },
        orderBy: { dateCreated: 'desc' }
    });

    console.log(`--- VA Numbers for ${refId} ---`);
    for (const res of responses) {
        const data = JSON.parse(res.payload || '{}');
        const va = data.va_numbers?.[0]?.va_number;
        const orderId = data.order_id;
        if (va) {
            const dateStr = res.dateCreated?.toISOString() ?? 'N/A';
            console.log(`Order: ${orderId} | VA: ${va} | Date: ${dateStr}`);
        }
    }
    process.exit(0);
}

findVAs();

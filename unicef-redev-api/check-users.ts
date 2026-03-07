import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const users = await prisma.uniUser.findMany({ take: 5 });
    console.log(users);
}
main();

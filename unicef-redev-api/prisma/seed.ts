import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminRole = await prisma.uniUserRole.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, title: 'Super Admin', name: 'super-admin', groupName: 'admin' },
  });

  await prisma.uniUserRole.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, title: 'Editor', name: 'editor', groupName: 'content' },
  });

  await prisma.uniUserRole.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, title: 'Viewer', name: 'viewer', groupName: 'content' },
  });

  const existingAdmin = await prisma.uniUser.findFirst({ where: { email: 'admin@unicef.org' } });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await prisma.uniUser.create({
      data: {
        email: 'admin@unicef.org',
        password: hashedPassword,
        name: 'Admin User',
        roleId: adminRole.id,
        status: 1,
        dateRegistered: new Date(),
        dateActivated: new Date(),
      },
    });
    console.log('Created admin user: admin@unicef.org / password123');
  } else {
    console.log('Admin user already exists');
  }

  const modules = ['pages', 'articles', 'media', 'menus', 'users', 'roles', 'settings', 'donations'];
  const actions = ['view', 'create', 'edit', 'delete'];
  for (const mod of modules) {
    for (const action of actions) {
      const existing = await prisma.uniPermissionsV2.findFirst({ where: { module: mod, action } });
      if (!existing) {
        await prisma.uniPermissionsV2.create({ data: { module: mod, action } });
      }
    }
  }
  console.log('Seeded permissions for modules:', modules.join(', '));

  console.log('Seed completed!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

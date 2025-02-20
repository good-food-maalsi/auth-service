import { PrismaClient } from '@prisma/client';
import { Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding roles...');

  const roles = [
    {
      role: Role.ADMIN,
      description: 'Administrator role with full access to the system.',
    },
    {
      role: Role.FRANCHISE_OWNER,
      description:
        'Franchise owner role with management privileges for a specific franchise.',
    },
    {
      role: Role.STAFF,
      description: 'Staff role with limited access to operational functions.',
    },
    {
      role: Role.CUSTOMER,
      description: 'Customer role with access to user-specific features.',
    },
  ];

  for (const role of roles) {
    await prisma.roles.create({
      data: role,
    });
  }

  console.log('Roles seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

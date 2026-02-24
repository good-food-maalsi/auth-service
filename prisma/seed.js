import { PrismaClient } from '@prisma/client';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';

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
    await prisma.roles.upsert({
      where: { role: role.role },
      create: role,
      update: { description: role.description },
    });
  }

  console.log('Roles seeded successfully!');

  // Create franchise owner user when SEED_FRANCHISE_ID is set
  const franchiseId = process.env.SEED_FRANCHISE_ID;
  if (franchiseId) {
    const email =
      process.env.FRANCHISE_OWNER_EMAIL || 'owner@demo.com';
    const username =
      process.env.FRANCHISE_OWNER_USERNAME || 'Franchise Owner';
    const password =
      process.env.FRANCHISE_OWNER_PASSWORD || 'Demo123!';

    const existingOwner = await prisma.user.findFirst({
      where: {
        email,
        franchiseId,
      },
    });

    if (existingOwner) {
      console.log('Franchise owner already exists for this franchise. Skipping.');
    } else {
      const hashedPassword = await argon2.hash(password);
      await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          franchiseId,
          doubleOptedIn: true,
          userRoles: {
            create: {
              role: {
                connect: { role: Role.FRANCHISE_OWNER },
              },
            },
          },
        },
      });
      console.log('Franchise owner created:', email, '(franchiseId:', franchiseId + ')');
    }
  } else {
    console.log(
      'SEED_FRANCHISE_ID not set. Run ./scripts/seed-dev.sh to seed with franchise owner.',
    );
  }
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

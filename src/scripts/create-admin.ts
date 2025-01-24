import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminUsername = process.env.ADMIN_USERNAME;

    if (!adminEmail || !adminPassword || !adminUsername) {
      console.error(
        'ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_USERNAME must be set',
      );
      process.exit(1);
    }

    const existingAdmin = await prisma.user.findFirst({
      where: {
        userRoles: {
          some: {
            role: {
              is: {
                role: {
                  equals: 'ADMIN',
                },
              },
            },
          },
        },
      },
    });

    if (existingAdmin) {
      console.log('Admin user already exists. Skipping creation.');
    } else {
      const hashedPassword = await argon2.hash(adminPassword);

      await prisma.user.create({
        data: {
          username: adminUsername,
          email: adminEmail,
          password: hashedPassword,
          userRoles: {
            create: {
              role: {
                connect: { role: 'ADMIN' },
              },
            },
          },
        },
      });

      console.log('Admin user created successfully.');
    }
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

export default createAdmin;

import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function ensureRolesExist() {
  const roles: { role: Role; description: string }[] = [
    { role: Role.ADMIN, description: 'Administrator role with full access to the system.' },
    { role: Role.FRANCHISE_OWNER, description: 'Franchise owner role with management privileges for a specific franchise.' },
    { role: Role.STAFF, description: 'Staff role with limited access to operational functions.' },
    { role: Role.CUSTOMER, description: 'Customer role with access to user-specific features.' },
  ];
  for (const r of roles) {
    await prisma.roles.upsert({
      where: { role: r.role },
      create: r,
      update: { description: r.description },
    });
  }
}

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

    await ensureRolesExist();

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

    const normalizedEmail = adminEmail.trim().toLowerCase();
    const hashedPassword = await argon2.hash(adminPassword);

    if (existingAdmin) {
      if (process.env.FORCE_UPDATE_ADMIN_PASSWORD === '1') {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { password: hashedPassword },
        });
        console.log('Admin password updated successfully.');
      } else {
        console.log('Admin user already exists. Skipping creation. Set FORCE_UPDATE_ADMIN_PASSWORD=1 to reset password.');
      }
    } else {
      await prisma.user.create({
        data: {
          username: adminUsername.trim(),
          email: normalizedEmail,
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

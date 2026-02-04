import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string; // userId
  role: Role[]; // user roles
  franchiseId?: string; // optional (null pour ADMIN et CUSTOMER)
}

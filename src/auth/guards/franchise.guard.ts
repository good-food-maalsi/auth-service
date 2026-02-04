import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

@Injectable()
export class FranchiseGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const bypassFranchiseCheck = this.reflector.get<boolean>(
      'bypassFranchiseCheck',
      context.getHandler(),
    );
    if (bypassFranchiseCheck) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userRoles = user.roles || [];
    const franchiseId = user.franchiseId;

    // ADMIN bypass all franchise checks
    const isAdmin = userRoles.some((r) => r.role.role === Role.ADMIN);
    if (isAdmin) return true;

    // For non-ADMIN, franchiseId must exist
    if (!franchiseId) {
      throw new ForbiddenException('Franchise ID required for this operation');
    }

    // Attacher franchiseId à la requête
    request.franchiseId = franchiseId;
    return true;
  }
}

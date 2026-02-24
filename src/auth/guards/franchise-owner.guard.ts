import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

@Injectable()
export class FranchiseOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userFranchiseId = user.franchiseId;

    // ADMIN peut gérer n'importe quelle franchise
    const isAdmin = user.roles.some((r) => r.role.role === Role.ADMIN);
    if (isAdmin) return true;

    // FRANCHISE_OWNER peut seulement gérer sa propre franchise
    const isFranchiseOwner = user.roles.some(
      (r) => r.role.role === Role.FRANCHISE_OWNER,
    );

    if (!isFranchiseOwner) {
      throw new ForbiddenException(
        'Only ADMIN or FRANCHISE_OWNER can perform this action',
      );
    }

    // Vérifier que le franchiseId cible correspond
    const targetFranchiseId =
      request.body?.franchiseId || request.params?.franchiseId;

    if (!targetFranchiseId) {
      throw new BadRequestException('Franchise ID required in request');
    }

    if (userFranchiseId !== targetFranchiseId) {
      throw new ForbiddenException(
        'You can only manage users in your own franchise',
      );
    }

    return true;
  }
}

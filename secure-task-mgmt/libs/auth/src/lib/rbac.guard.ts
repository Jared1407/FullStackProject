import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { ROLES_KEY } from './roles.decorator';
import { Role } from '@data/lib/enums';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPerms = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) || [];
    const allowedRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) || [];

    const req = context.switchToHttp().getRequest();
    const user = req.user; // set by JwtStrategy
    if (!user) throw new ForbiddenException('Unauthenticated');

    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    // Map roles to permissions (inheritance: OWNER > ADMIN > VIEWER)
    const rolePerms: Record<Role, string[]> = {
      [Role.OWNER]: ['task:create','task:read','task:update','task:delete','audit:read'],
      [Role.ADMIN]: ['task:create','task:read','task:update','task:delete','audit:read'],
      [Role.VIEWER]: ['task:read'],
    };

    const userPerms = rolePerms[user.role as Role] || [];

    const missing = requiredPerms.filter(p => !userPerms.includes(p));
    if (missing.length) {
      throw new ForbiddenException('Missing permissions: ' + missing.join(','));
    }
    return true;
  }
}

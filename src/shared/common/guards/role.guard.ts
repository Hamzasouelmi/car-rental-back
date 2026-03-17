import {
  CanActivate,
  ExecutionContext,
  mixin,
  Type,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthenticationGuard } from './jwt.guard';
import { RequestWithUser } from 'src/types/request-with-user';
import UserRole from 'src/auth/enum/role.enum';

export const RoleGuard = (roles: UserRole | UserRole[]): Type<CanActivate> => {
  class RoleGuardMixin extends JwtAuthenticationGuard {
    async canActivate(context: ExecutionContext) {
      await super.canActivate(context);
      const request = context.switchToHttp().getRequest<RequestWithUser>();
      const user = request?.user;
      if (!user.isActivated) {
        throw new UnauthorizedException('Confirm your email first');
      }

      return Array.isArray(roles)
        ? roles.some((role) => user?.authorities?.includes(role))
        : user?.authorities?.includes(roles);
    }
  }

  return mixin(RoleGuardMixin);
};

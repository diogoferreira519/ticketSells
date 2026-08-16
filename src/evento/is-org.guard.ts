import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IsOrgGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: { userId: string };
    }>();
    const userId = request.user?.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }

    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { isOrg: true },
    });

    if (!user?.isOrg) {
      throw new ForbiddenException('Acesso restrito a organizadores');
    }

    return true;
  }
}

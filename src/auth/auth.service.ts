import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.usuario.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        senha: hashedPassword,
        isCliente: true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        isOrg: true,
        isCliente: true,
        isPortaria: true,
      },
    });

    return {
      user,
      access_token: await this.signToken(user.id, user.email),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.senha);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      access_token: await this.signToken(user.id, user.email),
    };
  }

  async me(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        isOrg: true,
        isCliente: true,
        isPortaria: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }

  private signToken(userId: string, email: string) {
    return this.jwtService.signAsync({ sub: userId, email });
  }
}

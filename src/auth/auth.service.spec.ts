import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    usuario: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let jwt: { signAsync: jest.Mock };

  beforeEach(async () => {
    prisma = {
      usuario: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwt = { signAsync: jest.fn().mockResolvedValue('token-jwt') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('cria usuário cliente e retorna token', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
      prisma.usuario.create.mockResolvedValue({
        id: 'u1',
        nome: 'Ana',
        email: 'ana@test.com',
        isOrg: false,
        isCliente: true,
        isPortaria: false,
      });

      const result = await service.register({
        nome: 'Ana',
        email: 'ana@test.com',
        password: 'senha123',
      });

      expect(prisma.usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'ana@test.com',
            senha: 'hash',
            isCliente: true,
          }),
        }),
      );
      expect(result.access_token).toBe('token-jwt');
      expect(result.user.email).toBe('ana@test.com');
    });

    it('lança ConflictException se email já existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 'u1' });

      await expect(
        service.register({
          nome: 'Ana',
          email: 'ana@test.com',
          password: 'senha123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('retorna token com credenciais válidas', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'ana@test.com',
        senha: 'hash',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'ana@test.com',
        password: 'senha123',
      });

      expect(result.access_token).toBe('token-jwt');
      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'ana@test.com',
      });
    });

    it('lança UnauthorizedException se usuário não existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'x@test.com', password: 'senha' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lança UnauthorizedException se senha inválida', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'ana@test.com',
        senha: 'hash',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'ana@test.com', password: 'errada' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('me', () => {
    it('retorna o usuário', async () => {
      const user = {
        id: 'u1',
        nome: 'Ana',
        email: 'ana@test.com',
        isOrg: false,
        isCliente: true,
        isPortaria: false,
      };
      prisma.usuario.findUnique.mockResolvedValue(user);

      await expect(service.me('u1')).resolves.toEqual(user);
    });

    it('lança UnauthorizedException se usuário não existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(service.me('missing')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});

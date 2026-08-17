import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { IngressoService } from './ingresso.service';

describe('IngressoService', () => {
  let service: IngressoService;
  let prisma: {
    ingresso: {
      findUnique: jest.Mock;
      updateMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      ingresso: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngressoService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(IngressoService);
  });

  describe('findByQrcode', () => {
    it('retorna ingresso pago', async () => {
      prisma.ingresso.findUnique.mockResolvedValue({
        id: 'i1',
        qrcode: 'ABC',
        link: '/ingressos/ABC',
        status: 'VALIDO',
        pedido: { pagamentoStatus: 'PAGO' },
        assento: { descricao: 'A1' },
        evento: {
          titulo: 'Filme',
          data: new Date('2026-01-01'),
          sala: { descricao: 'Sala 1' },
        },
      });

      const result = await service.findByQrcode('ABC');
      expect(result.qrcode).toBe('ABC');
      expect(result.assento.descricao).toBe('A1');
    });

    it('lança NotFoundException se não pago ou inexistente', async () => {
      prisma.ingresso.findUnique.mockResolvedValue({
        id: 'i1',
        pedido: { pagamentoStatus: 'PENDENTE' },
      });

      await expect(service.findByQrcode('ABC')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('validar', () => {
    const baseIngresso = {
      id: 'i1',
      qrcode: 'ABC',
      idEvento: 'e1',
      status: 'VALIDO',
      usadoEm: null as Date | null,
      pedido: { pagamentoStatus: 'PAGO' },
      assento: { descricao: 'A1' },
      evento: { titulo: 'Filme' },
    };

    it('marca como USADO e retorna VALIDO', async () => {
      prisma.ingresso.findUnique.mockResolvedValue({ ...baseIngresso });
      prisma.ingresso.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.validar('ABC', 'e1');

      expect(result.resultado).toBe('VALIDO');
      expect(result.assento).toBe('A1');
      expect(prisma.ingresso.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'i1', status: 'VALIDO' },
          data: expect.objectContaining({ status: 'USADO' }),
        }),
      );
    });

    it('retorna INVALIDO se ingresso não existe', async () => {
      prisma.ingresso.findUnique.mockResolvedValue(null);

      await expect(service.validar('XYZ', 'e1')).resolves.toEqual({
        resultado: 'INVALIDO',
      });
    });

    it('retorna INVALIDO se cancelado', async () => {
      prisma.ingresso.findUnique.mockResolvedValue({
        ...baseIngresso,
        status: 'CANCELADO',
      });

      await expect(service.validar('ABC', 'e1')).resolves.toEqual({
        resultado: 'INVALIDO',
      });
    });

    it('retorna EVENTO_ERRADO se evento diferente', async () => {
      prisma.ingresso.findUnique.mockResolvedValue({ ...baseIngresso });

      await expect(service.validar('ABC', 'outro')).resolves.toEqual({
        resultado: 'EVENTO_ERRADO',
        assento: 'A1',
        eventoTitulo: 'Filme',
      });
    });

    it('retorna JA_UTILIZADO se já usado', async () => {
      const usadoEm = new Date('2026-01-02T10:00:00.000Z');
      prisma.ingresso.findUnique.mockResolvedValue({
        ...baseIngresso,
        status: 'USADO',
        usadoEm,
      });

      await expect(service.validar('ABC', 'e1')).resolves.toEqual({
        resultado: 'JA_UTILIZADO',
        assento: 'A1',
        eventoTitulo: 'Filme',
        usadoEm: usadoEm.toISOString(),
      });
    });
  });
});

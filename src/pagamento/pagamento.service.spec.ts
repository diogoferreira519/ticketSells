import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PagamentoService } from './pagamento.service';
import { RabbitmqService } from './rabbitmq.service';

describe('PagamentoService', () => {
  let service: PagamentoService;
  let prisma: {
    pedido: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    ingresso: {
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let rabbitmq: { publish: jest.Mock };

  beforeEach(async () => {
    prisma = {
      pedido: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      ingresso: {
        updateMany: jest.fn(),
      },
      $transaction: jest.fn().mockResolvedValue(undefined),
    };
    rabbitmq = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagamentoService,
        { provide: PrismaService, useValue: prisma },
        { provide: RabbitmqService, useValue: rabbitmq },
      ],
    }).compile();

    service = module.get(PagamentoService);
  });

  describe('enfileirar', () => {
    it('publica mensagem na fila quando pedido está pendente', async () => {
      prisma.pedido.findUnique.mockResolvedValue({
        id: 'p1',
        idUser: 'u1',
        pagamentoStatus: 'PENDENTE',
      });

      await expect(
        service.enfileirar('u1', 'p1', 'CONFIRMAR'),
      ).resolves.toEqual({ aceito: true });

      expect(rabbitmq.publish).toHaveBeenCalledWith({
        idPedido: 'p1',
        userId: 'u1',
        acao: 'CONFIRMAR',
      });
    });

    it('lança NotFoundException se pedido não existe', async () => {
      prisma.pedido.findUnique.mockResolvedValue(null);

      await expect(
        service.enfileirar('u1', 'p1', 'CONFIRMAR'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lança ForbiddenException se pedido é de outro usuário', async () => {
      prisma.pedido.findUnique.mockResolvedValue({
        id: 'p1',
        idUser: 'outro',
        pagamentoStatus: 'PENDENTE',
      });

      await expect(
        service.enfileirar('u1', 'p1', 'CONFIRMAR'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lança BadRequestException se pedido já foi processado', async () => {
      prisma.pedido.findUnique.mockResolvedValue({
        id: 'p1',
        idUser: 'u1',
        pagamentoStatus: 'PAGO',
      });

      await expect(
        service.enfileirar('u1', 'p1', 'CONFIRMAR'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('status', () => {
    it('retorna status do pedido do usuário', async () => {
      prisma.pedido.findUnique.mockResolvedValue({
        id: 'p1',
        idUser: 'u1',
        total: 50,
        pagamentoStatus: 'PENDENTE',
      });

      await expect(service.status('u1', 'p1')).resolves.toEqual({
        idPedido: 'p1',
        total: 50,
        pagamentoStatus: 'PENDENTE',
      });
    });

    it('lança ForbiddenException se pedido é de outro usuário', async () => {
      prisma.pedido.findUnique.mockResolvedValue({
        id: 'p1',
        idUser: 'outro',
        total: 50,
        pagamentoStatus: 'PENDENTE',
      });

      await expect(service.status('u1', 'p1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('aplicarResultado', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('marca pedido como PAGO ao confirmar', async () => {
      prisma.pedido.findUnique.mockResolvedValue({
        id: 'p1',
        idUser: 'u1',
        pagamentoStatus: 'PENDENTE',
      });
      prisma.pedido.update.mockResolvedValue({});

      const promise = service.aplicarResultado({
        idPedido: 'p1',
        userId: 'u1',
        acao: 'CONFIRMAR',
      });
      await jest.advanceTimersByTimeAsync(1000);
      await promise;

      expect(prisma.pedido.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { pagamentoStatus: 'PAGO' },
      });
    });

    it('cancela pedido e ingressos ao recusar', async () => {
      prisma.pedido.findUnique.mockResolvedValue({
        id: 'p1',
        idUser: 'u1',
        pagamentoStatus: 'PENDENTE',
      });
      prisma.pedido.update.mockReturnValue('updatePedido');
      prisma.ingresso.updateMany.mockReturnValue('updateIngressos');

      const promise = service.aplicarResultado({
        idPedido: 'p1',
        userId: 'u1',
        acao: 'RECUSAR',
      });
      await jest.advanceTimersByTimeAsync(1000);
      await promise;

      expect(prisma.$transaction).toHaveBeenCalledWith([
        'updatePedido',
        'updateIngressos',
      ]);
      expect(prisma.pedido.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { pagamentoStatus: 'CANCELADO' },
      });
      expect(prisma.ingresso.updateMany).toHaveBeenCalledWith({
        where: { idPedido: 'p1' },
        data: { status: 'CANCELADO' },
      });
    });

    it('não altera se pedido não está pendente', async () => {
      prisma.pedido.findUnique.mockResolvedValue({
        id: 'p1',
        idUser: 'u1',
        pagamentoStatus: 'PAGO',
      });

      const promise = service.aplicarResultado({
        idPedido: 'p1',
        userId: 'u1',
        acao: 'CONFIRMAR',
      });
      await jest.advanceTimersByTimeAsync(1000);
      await promise;

      expect(prisma.pedido.update).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});

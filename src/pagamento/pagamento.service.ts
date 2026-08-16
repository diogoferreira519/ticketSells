import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PagamentoAcao,
  PagamentoMensagem,
  PagamentoStatusResponse,
} from './pagamento.types';
import { RabbitmqService } from './rabbitmq.service';

@Injectable()
export class PagamentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitmq: RabbitmqService,
  ) {}

  async enfileirar(
    userId: string,
    idPedido: string,
    acao: PagamentoAcao,
  ): Promise<{ aceito: true }> {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: idPedido },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }
    if (pedido.idUser !== userId) {
      throw new ForbiddenException('Pedido não pertence ao usuário');
    }
    if (pedido.pagamentoStatus !== 'PENDENTE') {
      throw new BadRequestException('Pedido já foi processado');
    }

    const mensagem: PagamentoMensagem = { idPedido, userId, acao };
    await this.rabbitmq.publish(mensagem);
    return { aceito: true };
  }

  async status(
    userId: string,
    idPedido: string,
  ): Promise<PagamentoStatusResponse> {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: idPedido },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }
    if (pedido.idUser !== userId) {
      throw new ForbiddenException('Pedido não pertence ao usuário');
    }
    return {
      idPedido: pedido.id,
      total: Number(pedido.total),
      pagamentoStatus: pedido.pagamentoStatus,
    };
  }

  async aplicarResultado(mensagem: PagamentoMensagem): Promise<void> {
    const delayMs = 300 + Math.floor(Math.random() * 500);
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    const pedido = await this.prisma.pedido.findUnique({
      where: { id: mensagem.idPedido },
    });
    if (!pedido || pedido.pagamentoStatus !== 'PENDENTE') {
      return;
    }
    if (pedido.idUser !== mensagem.userId) {
      return;
    }

    if (mensagem.acao === 'CONFIRMAR') {
      await this.prisma.pedido.update({
        where: { id: mensagem.idPedido },
        data: { pagamentoStatus: 'PAGO' },
      });
      return;
    }

    await this.prisma.$transaction([
      this.prisma.pedido.update({
        where: { id: mensagem.idPedido },
        data: { pagamentoStatus: 'CANCELADO' },
      }),
      this.prisma.ingresso.updateMany({
        where: { idPedido: mensagem.idPedido },
        data: { status: 'CANCELADO' },
      }),
    ]);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type MeuIngresso = {
  id: string;
  qrcode: string;
  link: string;
  status: string;
  idPedido: string;
  assento: { id: string; descricao: string };
  evento: {
    id: string;
    titulo: string;
    data: Date;
    imgFilme: string;
    sala: { descricao: string };
  };
};

export type IngressoPublico = {
  id: string;
  qrcode: string;
  link: string;
  status: string;
  assento: { descricao: string };
  evento: {
    titulo: string;
    data: Date;
    sala: { descricao: string };
  };
};

@Injectable()
export class IngressoService {
  constructor(private readonly prisma: PrismaService) {}

  async listMeus(userId: string): Promise<MeuIngresso[]> {
    const ingressos = await this.prisma.ingresso.findMany({
      where: {
        pedido: { idUser: userId, pagamentoStatus: 'PAGO' },
        status: { not: 'CANCELADO' },
      },
      include: {
        assento: { select: { id: true, descricao: true } },
        evento: {
          select: {
            id: true,
            titulo: true,
            data: true,
            imgFilme: true,
            sala: { select: { descricao: true } },
          },
        },
      },
      orderBy: [{ evento: { data: 'asc' } }, { assento: { descricao: 'asc' } }],
    });

    return ingressos.map((ingresso) => ({
      id: ingresso.id,
      qrcode: ingresso.qrcode,
      link: ingresso.link,
      status: ingresso.status,
      idPedido: ingresso.idPedido,
      assento: ingresso.assento,
      evento: ingresso.evento,
    }));
  }

  async findByQrcode(qrcode: string): Promise<IngressoPublico> {
    const ingresso = await this.prisma.ingresso.findUnique({
      where: { qrcode },
      include: {
        pedido: { select: { pagamentoStatus: true } },
        assento: { select: { descricao: true } },
        evento: {
          select: {
            titulo: true,
            data: true,
            sala: { select: { descricao: true } },
          },
        },
      },
    });
    if (!ingresso || ingresso.pedido.pagamentoStatus !== 'PAGO') {
      throw new NotFoundException('Ingresso não encontrado');
    }
    return {
      id: ingresso.id,
      qrcode: ingresso.qrcode,
      link: ingresso.link,
      status: ingresso.status,
      assento: ingresso.assento,
      evento: ingresso.evento,
    };
  }
}

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

export type ValidarIngressoResultado =
  | 'VALIDO'
  | 'INVALIDO'
  | 'JA_UTILIZADO'
  | 'EVENTO_ERRADO';

export type ValidarIngressoResponse = {
  resultado: ValidarIngressoResultado;
  assento?: string;
  eventoTitulo?: string;
  usadoEm?: string | null;
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

  async validar(
    qrcode: string,
    idEvento: string,
  ): Promise<ValidarIngressoResponse> {
    const ingresso = await this.prisma.ingresso.findUnique({
      where: { qrcode },
      include: {
        pedido: { select: { pagamentoStatus: true } },
        assento: { select: { descricao: true } },
        evento: { select: { titulo: true } },
      },
    });

    if (
      !ingresso ||
      ingresso.pedido.pagamentoStatus !== 'PAGO' ||
      ingresso.status === 'CANCELADO'
    ) {
      return { resultado: 'INVALIDO' };
    }

    if (ingresso.idEvento !== idEvento) {
      return {
        resultado: 'EVENTO_ERRADO',
        assento: ingresso.assento.descricao,
        eventoTitulo: ingresso.evento.titulo,
      };
    }

    if (ingresso.status === 'USADO') {
      return {
        resultado: 'JA_UTILIZADO',
        assento: ingresso.assento.descricao,
        eventoTitulo: ingresso.evento.titulo,
        usadoEm: ingresso.usadoEm?.toISOString() ?? null,
      };
    }

    const usadoEm = new Date();
    const updated = await this.prisma.ingresso.updateMany({
      where: { id: ingresso.id, status: 'VALIDO' },
      data: { status: 'USADO', usadoEm },
    });

    if (updated.count === 1) {
      return {
        resultado: 'VALIDO',
        assento: ingresso.assento.descricao,
        eventoTitulo: ingresso.evento.titulo,
        usadoEm: usadoEm.toISOString(),
      };
    }

    const atual = await this.prisma.ingresso.findUnique({
      where: { id: ingresso.id },
      include: {
        assento: { select: { descricao: true } },
        evento: { select: { titulo: true } },
      },
    });

    return {
      resultado: 'JA_UTILIZADO',
      assento: atual?.assento.descricao ?? ingresso.assento.descricao,
      eventoTitulo: atual?.evento.titulo ?? ingresso.evento.titulo,
      usadoEm: atual?.usadoEm?.toISOString() ?? null,
    };
  }
}

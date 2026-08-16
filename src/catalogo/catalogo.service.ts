import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ensureAssentos } from '../sala/assentos.grid';

export type CatalogoSala = {
  id: string;
  descricao: string;
  capacidade: number;
};

export type CatalogoEvento = {
  id: string;
  idFilme: string;
  titulo: string;
  descricao: string;
  imgFilme: string;
  data: Date;
  preco: number;
  vagas: number;
  sala: CatalogoSala;
};

export type CatalogoAssento = {
  id: string;
  descricao: string;
  fila: number;
  coluna: number;
  ocupado: boolean;
};

export type CatalogoEventoDetalhe = CatalogoEvento & {
  assentos: CatalogoAssento[];
};

export type ReservaIngressoItem = {
  id: string;
  idAssento: string;
  descricaoAssento: string;
  qrcode: string;
  link: string;
};

export type ReservaResponse = {
  idPedido: string;
  total: number;
  pagamentoStatus: string;
  ingressos: ReservaIngressoItem[];
};

function inicioDoDia(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

@Injectable()
export class CatalogoService {
  constructor(private readonly prisma: PrismaService) {}

  async listProximos(): Promise<CatalogoEvento[]> {
    const eventos = await this.prisma.evento.findMany({
      where: { data: { gte: inicioDoDia() } },
      include: {
        sala: true,
        _count: {
          select: {
            ingressos: { where: { status: { not: 'CANCELADO' } } },
          },
        },
      },
      orderBy: { data: 'asc' },
    });
    return eventos.map((evento) => this.toListItem(evento));
  }

  async getDetalhe(id: string): Promise<CatalogoEventoDetalhe> {
    const evento = await this.findProximo(id);
    await ensureAssentos(this.prisma, evento.idSala, evento.sala.capacidade);

    const [assentos, ocupados] = await Promise.all([
      this.prisma.assento.findMany({
        where: { idSala: evento.idSala },
        orderBy: [{ fila: 'asc' }, { coluna: 'asc' }],
      }),
      this.prisma.ingresso.findMany({
        where: {
          idEvento: evento.id,
          status: { not: 'CANCELADO' },
        },
        select: { idAssento: true },
      }),
    ]);

    const ocupadoIds = new Set(ocupados.map((ingresso) => ingresso.idAssento));
    return {
      ...this.toListItem(evento),
      assentos: assentos.map((assento) => ({
        id: assento.id,
        descricao: assento.descricao,
        fila: assento.fila,
        coluna: assento.coluna,
        ocupado: ocupadoIds.has(assento.id),
      })),
    };
  }

  async reservar(
    userId: string,
    idEvento: string,
    idAssentos: string[],
  ): Promise<ReservaResponse> {
    const idsUnicos = [...new Set(idAssentos)];
    if (idsUnicos.length === 0) {
      throw new BadRequestException('Selecione ao menos um assento');
    }

    const evento = await this.findProximo(idEvento);
    await ensureAssentos(this.prisma, evento.idSala, evento.sala.capacidade);

    const assentos = await this.prisma.assento.findMany({
      where: { id: { in: idsUnicos }, idSala: evento.idSala },
    });
    if (assentos.length !== idsUnicos.length) {
      throw new NotFoundException('Assento não encontrado nesta sessão');
    }

    const ocupados = await this.prisma.ingresso.findMany({
      where: {
        idEvento,
        idAssento: { in: idsUnicos },
        status: { not: 'CANCELADO' },
      },
      select: { idAssento: true },
    });
    if (ocupados.length > 0) {
      throw new ConflictException('Assento já reservado');
    }

    const assentoPorId = new Map(assentos.map((a) => [a.id, a]));
    const total = new Prisma.Decimal(evento.preco).mul(idsUnicos.length);

    try {
      const pedido = await this.prisma.pedido.create({
        data: {
          idUser: userId,
          total,
          pagamentoStatus: 'PENDENTE',
          ingressos: {
            create: idsUnicos.map((idAssento) => {
              const qrcode = randomUUID();
              return {
                idAssento,
                idEvento,
                qrcode,
                status: 'VALIDO' as const,
                link: `/ingressos/${qrcode}`,
              };
            }),
          },
        },
        include: { ingressos: true },
      });

      return {
        idPedido: pedido.id,
        total: Number(pedido.total),
        pagamentoStatus: pedido.pagamentoStatus,
        ingressos: pedido.ingressos.map((ingresso) => ({
          id: ingresso.id,
          idAssento: ingresso.idAssento,
          descricaoAssento: assentoPorId.get(ingresso.idAssento)?.descricao ?? '',
          qrcode: ingresso.qrcode,
          link: ingresso.link,
        })),
      };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Assento já reservado');
      }
      throw err;
    }
  }

  private async findProximo(id: string) {
    const evento = await this.prisma.evento.findFirst({
      where: { id, data: { gte: inicioDoDia() } },
      include: {
        sala: true,
        _count: {
          select: {
            ingressos: { where: { status: { not: 'CANCELADO' } } },
          },
        },
      },
    });
    if (!evento) {
      throw new NotFoundException('Sessão não encontrada');
    }
    return evento;
  }

  private toListItem(evento: {
    id: string;
    idFilme: string;
    titulo: string;
    descricao: string;
    imgFilme: string;
    data: Date;
    preco: Prisma.Decimal;
    sala: { id: string; descricao: string; capacidade: number };
    _count: { ingressos: number };
  }): CatalogoEvento {
    return {
      id: evento.id,
      idFilme: evento.idFilme,
      titulo: evento.titulo,
      descricao: evento.descricao,
      imgFilme: evento.imgFilme,
      data: evento.data,
      preco: Number(evento.preco),
      vagas: Math.max(0, evento.sala.capacidade - evento._count.ingressos),
      sala: {
        id: evento.sala.id,
        descricao: evento.sala.descricao,
        capacidade: evento.sala.capacidade,
      },
    };
  }
}

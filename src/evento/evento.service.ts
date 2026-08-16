import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';

export type EventoSala = {
  id: string;
  descricao: string;
  capacidade: number;
};

export type EventoResponse = {
  id: string;
  idFilme: string;
  idUserOrganizador: string;
  idSala: string;
  titulo: string;
  descricao: string;
  imgFilme: string;
  data: Date;
  preco: number;
  criadoEm: Date;
  vendas: number;
  sala: EventoSala;
};

const eventoInclude = {
  sala: true,
  _count: {
    select: {
      ingressos: {
        where: { status: { not: 'CANCELADO' as const } },
      },
    },
  },
};

type EventoWithSalaAndCount = {
  id: string;
  idFilme: string;
  idUserOrganizador: string;
  idSala: string;
  titulo: string;
  descricao: string;
  imgFilme: string;
  data: Date;
  preco: Prisma.Decimal;
  criadoEm: Date;
  sala: { id: string; descricao: string; capacidade: number };
  _count: { ingressos: number };
};

@Injectable()
export class EventoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateEventoDto): Promise<EventoResponse> {
    await this.assertSalaDoOrganizador(userId, dto.idSala);
    const data = new Date(dto.data);
    await this.assertHorarioLivre(dto.idSala, data);

    const evento = await this.prisma.evento.create({
      data: {
        idFilme: dto.idFilme,
        idUserOrganizador: userId,
        idSala: dto.idSala,
        titulo: dto.titulo,
        descricao: dto.descricao,
        imgFilme: dto.imgFilme,
        data,
        preco: new Prisma.Decimal(dto.preco),
      },
      include: eventoInclude,
    });
    return this.toResponse(evento);
  }

  async findAllByOrganizador(userId: string): Promise<EventoResponse[]> {
    const eventos = await this.prisma.evento.findMany({
      where: { idUserOrganizador: userId },
      include: eventoInclude,
      orderBy: { data: 'desc' },
    });
    return eventos.map((evento) => this.toResponse(evento));
  }

  async findOneForOrganizador(
    userId: string,
    id: string,
  ): Promise<EventoResponse> {
    const evento = await this.findOwned(userId, id);
    return this.toResponse(evento);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateEventoDto,
  ): Promise<EventoResponse> {
    const existing = await this.findOwned(userId, id);
    this.assertSemVendas(existing._count.ingressos, 'alterado');

    const idSala = dto.idSala ?? existing.idSala;
    if (dto.idSala && dto.idSala !== existing.idSala) {
      await this.assertSalaDoOrganizador(userId, dto.idSala);
    }

    const data = dto.data ? new Date(dto.data) : existing.data;
    await this.assertHorarioLivre(idSala, data, id);

    const evento = await this.prisma.evento.update({
      where: { id },
      data: {
        ...(dto.idFilme != null ? { idFilme: dto.idFilme } : {}),
        ...(dto.idSala != null ? { idSala: dto.idSala } : {}),
        ...(dto.titulo != null ? { titulo: dto.titulo } : {}),
        ...(dto.descricao != null ? { descricao: dto.descricao } : {}),
        ...(dto.imgFilme != null ? { imgFilme: dto.imgFilme } : {}),
        ...(dto.data != null ? { data } : {}),
        ...(dto.preco != null ? { preco: new Prisma.Decimal(dto.preco) } : {}),
      },
      include: eventoInclude,
    });
    return this.toResponse(evento);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.findOwned(userId, id);
    this.assertSemVendas(existing._count.ingressos, 'excluído');
    await this.prisma.evento.delete({ where: { id } });
  }

  private async findOwned(
    userId: string,
    id: string,
  ): Promise<EventoWithSalaAndCount> {
    const evento = await this.prisma.evento.findFirst({
      where: { id, idUserOrganizador: userId },
      include: eventoInclude,
    });
    if (!evento) {
      throw new NotFoundException('Evento não encontrado');
    }
    return evento;
  }

  private async assertSalaDoOrganizador(userId: string, idSala: string) {
    const sala = await this.prisma.sala.findUnique({
      where: { id: idSala },
    });
    if (!sala) {
      throw new NotFoundException('Sala não encontrada');
    }
    if (sala.idUserOrganizador !== userId) {
      throw new ForbiddenException('Sala não pertence ao organizador');
    }
  }

  private async assertHorarioLivre(
    idSala: string,
    data: Date,
    excludeId?: string,
  ) {
    const eventoMesmoHorario = await this.prisma.evento.findFirst({
      where: {
        idSala,
        data,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (eventoMesmoHorario) {
      throw new ConflictException(
        'Já existe um evento nesta sala no mesmo dia e horário',
      );
    }
  }

  private assertSemVendas(vendas: number, acao: 'alterado' | 'excluído') {
    if (vendas > 0) {
      throw new ConflictException(`Evento com vendas não pode ser ${acao}`);
    }
  }

  private toResponse(evento: EventoWithSalaAndCount): EventoResponse {
    return {
      id: evento.id,
      idFilme: evento.idFilme,
      idUserOrganizador: evento.idUserOrganizador,
      idSala: evento.idSala,
      titulo: evento.titulo,
      descricao: evento.descricao,
      imgFilme: evento.imgFilme,
      data: evento.data,
      preco: Number(evento.preco),
      criadoEm: evento.criadoEm,
      vendas: evento._count.ingressos,
      sala: {
        id: evento.sala.id,
        descricao: evento.sala.descricao,
        capacidade: evento.sala.capacidade,
      },
    };
  }
}

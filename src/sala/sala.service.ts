import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { assentosParaCapacidade } from './assentos.grid';
import { CreateSalaDto } from './dto/create-sala.dto';

export type SalaResponse = {
  id: string;
  idUserOrganizador: string;
  capacidade: number;
  descricao: string;
};

@Injectable()
export class SalaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSalaDto): Promise<SalaResponse> {
    return this.prisma.$transaction(async (tx) => {
      const sala = await tx.sala.create({
        data: {
          idUserOrganizador: userId,
          descricao: dto.descricao,
          capacidade: dto.capacidade,
        },
      });
      await tx.assento.createMany({
        data: assentosParaCapacidade(sala.id, sala.capacidade),
      });
      return sala;
    });
  }

  async findAllByOrganizador(userId: string): Promise<SalaResponse[]> {
    return this.prisma.sala.findMany({
      where: { idUserOrganizador: userId },
      orderBy: { descricao: 'asc' },
    });
  }
}

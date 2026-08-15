import { PagamentoStatus } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePedidoDto {
  @IsString()
  idUser!: string;

  @IsNumber()
  @Min(0)
  total!: number;

  @IsOptional()
  @IsEnum(PagamentoStatus)
  pagamentoStatus?: PagamentoStatus;
}

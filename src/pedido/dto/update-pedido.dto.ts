import { PagamentoStatus } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePedidoDto {
  @IsOptional()
  @IsString()
  idUser?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  total?: number;

  @IsOptional()
  @IsEnum(PagamentoStatus)
  pagamentoStatus?: PagamentoStatus;
}

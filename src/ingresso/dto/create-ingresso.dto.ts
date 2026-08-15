import { IngressoStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateIngressoDto {
  @IsString()
  idPedido!: string;

  @IsString()
  idUser!: string;

  @IsString()
  idAssento!: string;

  @IsString()
  qrcode!: string;

  @IsOptional()
  @IsEnum(IngressoStatus)
  status?: IngressoStatus;

  @IsString()
  link!: string;

  @IsOptional()
  @IsDateString()
  usadoEm?: string;
}

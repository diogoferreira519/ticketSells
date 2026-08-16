import { IngressoStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateIngressoDto {
  @IsOptional()
  @IsString()
  idPedido?: string;

  @IsOptional()
  @IsString()
  idAssento?: string;

  @IsOptional()
  @IsString()
  idEvento?: string;

  @IsOptional()
  @IsString()
  qrcode?: string;

  @IsOptional()
  @IsEnum(IngressoStatus)
  status?: IngressoStatus;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsDateString()
  usadoEm?: string;
}

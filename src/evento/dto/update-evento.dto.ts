import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateEventoDto {
  @IsOptional()
  @IsString()
  idFilme?: string;

  @IsOptional()
  @IsString()
  idUserOrganizador?: string;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  imgFilme?: string;

  @IsOptional()
  @IsString()
  local?: string;

  @IsOptional()
  @IsDateString()
  data?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  preco?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  capacidade?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  ingressosDisponiveis?: number;
}

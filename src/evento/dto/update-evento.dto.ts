import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateEventoDto {
  @IsOptional()
  @IsString()
  idFilme?: string;

  @IsOptional()
  @IsString()
  idSala?: string;

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
  @IsDateString()
  data?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  preco?: number;
}

import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsString, Min } from 'class-validator';

export class CreateEventoDto {
  @IsString()
  idFilme!: string;

  @IsString()
  idSala!: string;

  @IsString()
  titulo!: string;

  @IsString()
  descricao!: string;

  @IsString()
  imgFilme!: string;

  @IsDateString()
  data!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  preco!: number;
}

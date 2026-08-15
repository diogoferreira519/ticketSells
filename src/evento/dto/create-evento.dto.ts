import { IsDateString, IsInt, IsNumber, IsString, Min } from 'class-validator';

export class CreateEventoDto {
  @IsString()
  idFilme!: string;

  @IsString()
  idUserOrganizador!: string;

  @IsString()
  titulo!: string;

  @IsString()
  descricao!: string;

  @IsString()
  imgFilme!: string;

  @IsString()
  local!: string;

  @IsDateString()
  data!: string;

  @IsNumber()
  @Min(0)
  preco!: number;

  @IsInt()
  @Min(0)
  capacidade!: number;

  @IsInt()
  @Min(0)
  ingressosDisponiveis!: number;
}

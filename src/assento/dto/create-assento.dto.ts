import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateAssentoDto {
  @IsString()
  idUser!: string;

  @IsString()
  descricao!: string;

  @IsOptional()
  @IsBoolean()
  disponivel?: boolean;
}

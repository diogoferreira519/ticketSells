import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateAssentoDto {
  @IsOptional()
  @IsString()
  idUser?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsBoolean()
  disponivel?: boolean;
}

import { IsOptional, IsString } from 'class-validator';

export class UpdateAssentoDto {
  @IsOptional()
  @IsString()
  idSala?: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}

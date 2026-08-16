import { IsString } from 'class-validator';

export class CreateAssentoDto {
  @IsString()
  idSala!: string;

  @IsString()
  descricao!: string;
}

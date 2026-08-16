import { Type } from 'class-transformer';
import { IsInt, IsString, Min } from 'class-validator';

export class CreateSalaDto {
  @IsString()
  descricao!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacidade!: number;
}

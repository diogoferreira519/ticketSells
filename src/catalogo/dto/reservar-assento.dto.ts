import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ReservarAssentoDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  idAssentos!: string[];
}

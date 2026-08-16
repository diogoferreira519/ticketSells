import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class DiscoverFilmeDto {
  @Type(() => Number)
  @IsInt()
  genreId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}

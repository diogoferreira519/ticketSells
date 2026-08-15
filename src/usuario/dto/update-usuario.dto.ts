import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  senha?: string;

  @IsOptional()
  @IsBoolean()
  isOrg?: boolean;

  @IsOptional()
  @IsBoolean()
  isCliente?: boolean;

  @IsOptional()
  @IsBoolean()
  isPortaria?: boolean;
}

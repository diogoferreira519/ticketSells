import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  nome!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  senha!: string;

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

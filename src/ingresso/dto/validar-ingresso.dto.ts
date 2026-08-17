import { IsString } from 'class-validator';

export class ValidarIngressoDto {
  @IsString()
  qrcode!: string;

  @IsString()
  idEvento!: string;
}

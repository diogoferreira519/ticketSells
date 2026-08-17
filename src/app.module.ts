import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { existsSync } from 'fs';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { CatalogoModule } from './catalogo/catalogo.module';
import { EventoModule } from './evento/evento.module';
import { FilmeModule } from './filme/filme.module';
import { IngressoModule } from './ingresso/ingresso.module';
import { PagamentoModule } from './pagamento/pagamento.module';
import { PrismaModule } from './prisma/prisma.module';
import { SalaModule } from './sala/sala.module';

const clientDistPath = join(__dirname, '..', 'client', 'dist');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    FilmeModule,
    EventoModule,
    SalaModule,
    CatalogoModule,
    IngressoModule,
    PagamentoModule,
    ...(existsSync(clientDistPath)
      ? [
          ServeStaticModule.forRoot({
            rootPath: clientDistPath,
            exclude: [
              '/auth/(.*)',
              '/filmes/(.*)',
              '/eventos/(.*)',
              '/salas/(.*)',
              '/catalogo/(.*)',
              '/pagamentos/(.*)',
              '/ingressos/meus',
              '/ingressos/por-codigo/(.*)',
              '/ingressos/validar',
            ],
          }),
        ]
      : []),
  ],
})
export class AppModule {}

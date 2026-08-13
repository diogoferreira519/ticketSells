import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { existsSync } from 'fs';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';

const clientDistPath = join(__dirname, '..', 'client', 'dist');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ...(existsSync(clientDistPath)
      ? [
          ServeStaticModule.forRoot({
            rootPath: clientDistPath,
            exclude: ['/auth/(.*)'],
          }),
        ]
      : []),
  ],
})
export class AppModule {}

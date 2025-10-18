import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      ...AppDataSource.options,
      entities: [__dirname + '/**/*.entity.{js,ts}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
    }),
  ],
})
export class AppModule {}

import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {createKeyv} from '@keyv/redis';

export const RedisOptions: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    const port = configService.get<number>('REDIS_PORT');
    const host = configService.get<string>('REDIS_HOST');
    const ttl = configService.get<number>('REDIS_TTL_IN_SECONDS', 60) * 1000;

    const store = createKeyv(`redis://${host}:${port}`)

    return {
      ttl,
      stores: [store]
    };
  },
  inject: [ConfigService],
};
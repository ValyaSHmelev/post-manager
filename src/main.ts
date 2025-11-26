import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Registry, collectDefaultMetrics } from 'prom-client';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('QTIM Post Manager API')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Prometheus metrics
  const register = new Registry();
  collectDefaultMetrics({ register });
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/metrics', async (req, res) => {
    res.header('Content-Type', register.contentType);
    res.send(await register.metrics());
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

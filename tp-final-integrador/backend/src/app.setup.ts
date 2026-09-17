import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

export const DEFAULT_API_VERSION = '1';
const GLOBAL_PREFIX = 'api';

export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService);

  app.use(helmet());

  const corsOrigin = configService.get<string>(
    'CORS_ORIGIN',
    'http://localhost:4200',
  );
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.setGlobalPrefix(GLOBAL_PREFIX);

  // URI versioning  default '1' -> /api/v1/...
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: DEFAULT_API_VERSION,
  });

  // Global ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (configService.get<boolean>('SWAGGER_HABILITADO')) {
    // Swagger Documentation
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Sistema de Gestión de Turnos Médicos')
      .setDescription('API REST para la gestión de turnos médicos')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${GLOBAL_PREFIX}/docs`, app, document);
  }
}

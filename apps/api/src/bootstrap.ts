import { NestFactory } from "@nestjs/core";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { AppModule } from "@signa/api/app.module";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { Logger } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { cleanupOpenApiDoc } from "@signa/nest-contract";

export async function bootstrap(): Promise<INestApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 10 * 1024 * 1024,
      trustProxy: true,

      connectionTimeout: 30_000,
      requestTimeout: 60_000,
      keepAliveTimeout: 72_000,

      maxParamLength: 200
    })
  );

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"]
  });
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Signa API")
    .setDescription("Signa service API")
    .setVersion("1.0.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        in: "header",
        name: "Authorization"
      },
      "jwt"
    )
    .addSecurityRequirements("jwt")
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, cleanupOpenApiDoc(documentFactory()));

  const port = process.env["PORT"] || 3000;

  await app.listen(port, "0.0.0.0");

  Logger.log(`Application is running on: http://localhost:${port}/api`);
  Logger.log(`API Documentation: http://localhost:${port}/api/docs`);

  return app;
}

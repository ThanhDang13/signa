import { NestFactory } from "@nestjs/core";
import { AppModule } from "@signa/worker/app.module";
import { Logger } from "@nestjs/common";

export async function bootstrap() {
  const logger = new Logger("Bootstrap");

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["log", "error", "warn", "debug", "verbose"]
  });

  await app.init();
  app.enableShutdownHooks();

  logger.log("Worker application started successfully");
  logger.log("Registered processors will listen for jobs on their respective queues");

  // Keep the process alive
  process.on("SIGTERM", async () => {
    logger.log("SIGTERM received, closing worker gracefully");
    await app.close();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    logger.log("SIGINT received, closing worker gracefully");
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start worker:", error);
  process.exit(1);
});

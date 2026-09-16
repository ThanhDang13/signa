import { logger, toDslError } from "@signa/api/error-handler.js";
import { handleBootstrapError } from "@signa/runtime-error";

process.on("uncaughtException", (err) => {
  handleBootstrapError(toDslError(err), logger);
});

process.on("unhandledRejection", (reason) => {
  handleBootstrapError(toDslError(reason), logger);
});

import { migrate } from "@signa/runtime-drizzle";
import { getEnv } from "@signa/nest-config";

migrate(getEnv("DATABASE_URL"))
  .then(() => process.exit(0))
  .catch((err) => {
    handleBootstrapError(toDslError(err), logger);
  });

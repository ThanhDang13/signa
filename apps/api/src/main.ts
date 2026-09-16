import { logger, toDslError } from "@signa/api/error-handler.js";
import { handleBootstrapError } from "@signa/runtime-error";

process.on("uncaughtException", (err) => {
  handleBootstrapError(toDslError(err), logger);
});

process.on("unhandledRejection", (reason) => {
  handleBootstrapError(toDslError(reason), logger);
});

import("./bootstrap.js")
  .then(({ bootstrap }) => bootstrap())
  .catch((err) => {
    handleBootstrapError(toDslError(err), logger);
  });

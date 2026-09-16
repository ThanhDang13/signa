import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import { Catch, Injectable, Inject } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { ErrorDispatcher } from "@signa/dsl-error";
import { ERROR_DISPATCHER } from "../tokens";
import { ErrorNormalizer } from "../normalizers/error-normalizer";

@Catch()
@Injectable()
export class ErrorExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(ERROR_DISPATCHER) private readonly dispatcher: ErrorDispatcher,
    private readonly normalizer: ErrorNormalizer
  ) {}

  async catch(exception: Error, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest & { id?: string }>();

    try {
      const dslError = this.normalizer.normalize(exception);
      const result = await this.dispatcher.dispatch(dslError, "http", { reply, request });

      if (!result.handled) {
        reply.status(500).send({ message: "Internal server error" });
      }
    } catch {
      reply.status(500).send({ message: "Internal server error" });
    }
  }
}

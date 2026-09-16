import type { ErrorHandler, DispatchResult, DslError } from "@signa/dsl-error";
import type { FastifyReply, FastifyRequest } from "fastify";
import { Injectable } from "@nestjs/common";
import { ErrorSerializer } from "../serializers/error-serializer";
import { ErrorMapperService } from "../services/error-mapper.service";

/**
 * Context passed to the HTTP error handler.
 * Contains the Fastify reply and request objects needed for response serialization.
 */
export interface HttpErrorContext {
  reply: FastifyReply;
  request: FastifyRequest & { id?: string };
}

/**
 * HTTP error handler for the error-runtime dispatcher system.
 * Delegates to existing ErrorSerializer and ErrorMapperService to maintain
 * backward compatibility with the current nest-error implementation.
 *
 * This handler is registered with the ErrorDispatcher for the "http" phase
 * and is invoked by ErrorExceptionFilter when exceptions occur during request handling.
 */
@Injectable()
export class HttpErrorHandler implements ErrorHandler<"http"> {
  readonly phase = "http" as const;

  constructor(
    private readonly serializer: ErrorSerializer,
    private readonly mapper: ErrorMapperService
  ) {}

  /**
   * Handle an HTTP error by serializing it and sending the response.
   *
   * @param error - The DslError to handle
   * @param context - HTTP context containing reply and request objects
   * @returns DispatchResult indicating the error was handled
   */
  handle(error: DslError, context?: HttpErrorContext): DispatchResult {
    if (!context) {
      // If no context provided, we can't send a response
      return { handled: false };
    }

    const { reply, request } = context;

    // Get HTTP status code from error category
    const status = this.mapper.getHttpStatus(error);

    // Generate or use existing trace ID
    const traceId = request.id ?? this.generateTraceId();

    // Serialize the error using existing serializer
    const serialized = this.serializer.serialize(error, traceId);

    // Send the response
    reply.status(status).send({
      error: serialized,
      path: (request as { url?: string }).url,
      timestamp: new Date().toISOString()
    });

    return { handled: true };
  }

  private generateTraceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

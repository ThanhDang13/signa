import * as React from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { AlertCircle, Inbox, LogIn, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@signa/react-ui/components/ui/alert";
import { Button } from "@signa/react-ui/components/ui/button";
import { Skeleton } from "@signa/react-ui/components/ui/skeleton";

export type AsyncStatus = "pending" | "error" | "success";

export interface ApiErrorShape {
  code?: string;
  message: string;
  statusCode?: number;
  details?: unknown;
}

interface HttpClientErrorShape {
  status: number;
  error?: {
    code?: string;
    message?: string;
  };
}

function isApiErrorShape(error: unknown): error is ApiErrorShape {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

function isHttpClientErrorShape(error: unknown): error is HttpClientErrorShape {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as Record<string, unknown>).status === "number"
  );
}

function getErrorMessage(error: unknown): string {
  if (isApiErrorShape(error)) return error.message;

  if (isHttpClientErrorShape(error) && typeof error.error?.message === "string") {
    return error.error.message;
  }

  if (error instanceof Error) return error.message;

  return "Something went wrong while loading this data.";
}

function getErrorCode(error: unknown): string | undefined {
  if (isApiErrorShape(error)) return error.code;
  if (isHttpClientErrorShape(error)) return error.error?.code;
  return undefined;
}

function isDefaultFatalError(error: unknown): boolean {
  if (isHttpClientErrorShape(error)) {
    if (error.status === 401) return true;
    const code = error.error?.code;
    return code === "UNAUTHENTICATED" || code === "SESSION_EXPIRED";
  }

  if (isApiErrorShape(error)) {
    if (error.statusCode === 401) return true;
    return error.code === "UNAUTHENTICATED" || error.code === "SESSION_EXPIRED";
  }

  return false;
}

interface SharedProps<TData, TError = unknown> {
  isFetching?: boolean;
  isPlaceholderData?: boolean;
  onRetry?: () => void;
  onFatalError?: () => void;
  isFatalError?: (error: TError) => boolean;
  isEmpty?: (data: TData) => boolean;
  children: (data: TData) => React.ReactNode;
  loadingFallback?: React.ReactNode;
  emptyFallback?: React.ReactNode;
  errorFallback?: (error: TError, helpers: ErrorFallbackHelpers) => React.ReactNode;
  refetchIndicator?: React.ReactNode;
  placeholderIndicator?: React.ReactNode;
  className?: string;
}

export interface ErrorFallbackHelpers {
  retry?: () => void;
  isFatal: boolean;
  onFatalError?: () => void;
}

export type AsyncBoundaryProps<TData, TError = unknown> = SharedProps<TData, TError> &
  (
    | { status: "pending"; data?: undefined; error?: undefined }
    | { status: "error"; data?: undefined; error: TError }
    | { status: "success"; data: TData; error?: undefined }
  );

export function AsyncBoundary<TData, TError = unknown>({
  status,
  data,
  error,
  isFetching,
  isPlaceholderData,
  onRetry,
  onFatalError,
  isFatalError = isDefaultFatalError as (error: TError) => boolean,
  isEmpty: isEmptyProp,
  children,
  loadingFallback,
  emptyFallback,
  errorFallback,
  refetchIndicator,
  placeholderIndicator,
  className
}: AsyncBoundaryProps<TData, TError>) {
  if (status === "pending") {
    return (
      <div className={className} aria-busy="true">
        {loadingFallback ?? <DefaultLoading />}
      </div>
    );
  }

  if (status === "error") {
    const fatal = isFatalError(error);

    return (
      <div className={className} role="alert">
        {errorFallback ? (
          errorFallback(error, { retry: onRetry, isFatal: fatal, onFatalError })
        ) : (
          <DefaultError
            error={error}
            onRetry={onRetry}
            isFatal={fatal}
            onFatalError={onFatalError}
          />
        )}
      </div>
    );
  }

  const isEmpty = isEmptyProp
    ? isEmptyProp(data)
    : data == null || (Array.isArray(data) && data.length === 0);

  if (isEmpty) {
    return <div className={className}>{emptyFallback ?? <DefaultEmpty />}</div>;
  }

  return (
    <div className={className}>
      {isFetching && (refetchIndicator ?? <DefaultRefetchIndicator />)}
      <div
        data-placeholder={isPlaceholderData ? "true" : undefined}
        className={
          isPlaceholderData
            ? "pointer-events-none opacity-60 transition-opacity"
            : "transition-opacity"
        }
      >
        {children(data)}
      </div>
      {isPlaceholderData && (placeholderIndicator ?? <DefaultPlaceholderIndicator />)}
    </div>
  );
}

type QueryBoundaryProps<TData, TError> = Omit<
  SharedProps<TData, TError>,
  "isFetching" | "isPlaceholderData" | "onRetry"
> & {
  query: UseQueryResult<TData, TError>;
};

export function QueryBoundary<TData, TError = unknown>({
  query,
  ...rest
}: QueryBoundaryProps<TData, TError>) {
  const { status, data, error, isFetching, isPlaceholderData, refetch } = query;

  const sharedRest = {
    ...rest,
    isFetching,
    isPlaceholderData,
    onRetry: () => {
      void refetch();
    }
  };

  if (status === "pending") {
    return <AsyncBoundary status="pending" {...sharedRest} />;
  }

  if (status === "error") {
    return <AsyncBoundary status="error" error={error} {...sharedRest} />;
  }

  return <AsyncBoundary status="success" data={data} {...sharedRest} />;
}

function DefaultLoading() {
  return (
    <div className="flex flex-col gap-3 p-4" data-testid="async-loading">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

function DefaultRefetchIndicator() {
  return (
    <div
      className="text-muted-foreground flex items-center gap-1.5 px-1 pb-2 text-xs"
      aria-live="polite"
      data-testid="async-refetch-indicator"
    >
      <RefreshCw className="h-3 w-3 animate-spin" />
      <span>Updating…</span>
    </div>
  );
}

function DefaultPlaceholderIndicator() {
  return (
    <div
      className="text-muted-foreground flex items-center gap-1.5 px-1 pt-2 text-xs"
      aria-live="polite"
      data-testid="async-placeholder-indicator"
    >
      <RefreshCw className="h-3 w-3 animate-spin" />
      <span>Loading next page…</span>
    </div>
  );
}

interface DefaultErrorProps {
  error: unknown;
  onRetry?: () => void;
  isFatal?: boolean;
  onFatalError?: () => void;
}

function DefaultError({ error, onRetry, isFatal, onFatalError }: DefaultErrorProps) {
  const message = getErrorMessage(error);
  const code = getErrorCode(error);

  if (isFatal) {
    return (
      <Alert variant="destructive" data-testid="async-error-fatal">
        <LogIn className="h-4 w-4" />
        <AlertTitle>Your session has ended</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <span>Sign in again to keep going.</span>
          {onFatalError && (
            <Button size="sm" variant="outline" onClick={onFatalError} className="w-fit">
              Go to login
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" data-testid="async-error">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Failed to load{code ? ` (${code})` : ""}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span>{message}</span>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="w-fit">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function DefaultEmpty() {
  return (
    <div
      className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center"
      data-testid="async-empty"
    >
      <Inbox className="h-8 w-8" />
      <p className="text-sm">No data found.</p>
    </div>
  );
}

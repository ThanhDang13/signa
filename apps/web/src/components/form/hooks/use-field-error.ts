import { useStore } from "@tanstack/react-form";
import type { AnyFieldApi } from "@tanstack/react-form";

import { ErrorStrategy } from "@signa/web/components/form/types";
import {
  useFieldContext,
  useFormContext
} from "@signa/web/components/form/hooks/use-form-context";

function resolveIsInvalid(
  strategy: ErrorStrategy,
  meta: AnyFieldApi["state"]["meta"],
  isSubmitted: boolean
): boolean {
  switch (strategy) {
    case "always":
      return !meta.isValid;
    case "dirty":
      return meta.isDirty && !meta.isValid;
    case "submit":
      return isSubmitted && !meta.isValid;
    case "touched":
    default:
      return meta.isTouched && !meta.isValid;
  }
}

export function useFieldError<TData = unknown>(errorStrategy: ErrorStrategy = "touched") {
  const field = useFieldContext<TData>();
  const form = useFormContext();

  const isSubmitted = useStore(form.store, (state) =>
    errorStrategy === "submit" ? state.isSubmitted : false
  );

  const isInvalid = resolveIsInvalid(errorStrategy, field.state.meta, isSubmitted);

  return { field, isInvalid };
}

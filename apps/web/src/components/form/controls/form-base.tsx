import type { ReactNode } from "react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel
} from "@signa/react-ui/components/ui/field";
import { ControlPlacement, FormControlProps } from "@signa/web/components/form/types";
import { useFieldError } from "@signa/web/components/form/hooks/use-field-error";

function renderByPlacement(
  placement: ControlPlacement,
  labelEl: ReactNode,
  descEl: ReactNode,
  children: ReactNode
) {
  switch (placement) {
    case "before-content":
      return (
        <>
          {children}
          <FieldContent>
            {labelEl}
            {descEl}
          </FieldContent>
        </>
      );
    case "inside-content":
      return (
        <FieldContent>
          {labelEl}
          {children}
          {descEl}
        </FieldContent>
      );
    case "after-content":
    default:
      return (
        <>
          <FieldContent>
            {labelEl}
            {descEl}
          </FieldContent>
          {children}
        </>
      );
  }
}

type FormBaseProps = FormControlProps & { children: ReactNode };

export function FormBase({
  children,
  label,
  description,
  layout = "vertical",
  placement = "after-content",
  errorStrategy = "touched",
  renderLabel,
  renderDescription,
  renderError
}: FormBaseProps) {
  const { field, isInvalid } = useFieldError(errorStrategy);
  const meta = field.state.meta;

  const labelEl = renderLabel?.(field) ?? <FieldLabel htmlFor={field.name}>{label}</FieldLabel>;

  const descEl =
    renderDescription?.(field) ??
    (description ? <FieldDescription>{description}</FieldDescription> : null);

  const errorEl = renderError?.(field) ?? <FieldError errors={isInvalid ? meta.errors : []} />;

  return (
    <Field
      data-invalid={isInvalid}
      data-layout={layout}
      orientation={layout === "vertical" ? undefined : "horizontal"}
    >
      {renderByPlacement(placement, labelEl, descEl, children)}
      {errorEl}
    </Field>
  );
}

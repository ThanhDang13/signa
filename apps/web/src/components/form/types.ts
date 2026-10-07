import type { AnyFieldApi } from "@tanstack/react-form";
import type { ReactNode } from "react";

export type LayoutVariant = "vertical" | "horizontal" | "inline";
export type ControlPlacement = "after-content" | "before-content" | "inside-content";
export type ErrorStrategy = "touched" | "dirty" | "submit" | "always";

export type RenderFn = (field: AnyFieldApi) => ReactNode;

export type FormControlProps = {
  label: string;
  description?: string;
  layout?: LayoutVariant;
  placement?: ControlPlacement;
  errorStrategy?: ErrorStrategy;
  renderLabel?: RenderFn;
  renderDescription?: RenderFn;
  renderError?: RenderFn;
};

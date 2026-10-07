import { createFormHookContexts } from "@tanstack/react-form";

const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();

export { useFieldContext, useFormContext, fieldContext, formContext };

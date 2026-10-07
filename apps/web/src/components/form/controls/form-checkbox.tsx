import { Checkbox } from "@signa/react-ui/components/ui/checkbox";
import { FormBase } from "@signa/web/components/form/controls/form-base";
import { useFieldError } from "@signa/web/components/form/hooks/use-field-error";
import { FormControlProps } from "@signa/web/components/form/types";
import { Prettify } from "@signa/web/lib/types";

type FormCheckboxControlProps = Prettify<FormControlProps & { disabled?: boolean }>;

export function FormCheckbox(props: FormCheckboxControlProps) {
  const { disabled, ...formBaseProps } = props;
  const { field, isInvalid } = useFieldError<boolean>(props.errorStrategy);

  return (
    <FormBase {...formBaseProps} placement={formBaseProps.placement ?? "before-content"}>
      <Checkbox
        id={field.name}
        name={field.name}
        checked={field.state.value}
        onCheckedChange={(checked) => field.handleChange(checked === true)}
        onBlur={field.handleBlur}
        aria-invalid={isInvalid}
        disabled={disabled}
      />
    </FormBase>
  );
}

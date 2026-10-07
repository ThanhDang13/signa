import { Input } from "@signa/react-ui/components/ui/input";
import { FormBase } from "@signa/web/components/form/controls/form-base";
import { useFieldError } from "@signa/web/components/form/hooks/use-field-error";
import { FormControlProps } from "@signa/web/components/form/types";
import { Prettify } from "@signa/web/lib/types";

type FormInputControlProps = Prettify<
  FormControlProps & {
    placeholder?: string;
    autoComplete?: string;
    autoFocus?: boolean;
    readOnly?: boolean;
  }
>;

export function FormInput(props: FormInputControlProps) {
  const { ...baseProps } = props;
  const { field, isInvalid } = useFieldError<string>(props.errorStrategy);

  return (
    <FormBase {...baseProps}>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        placeholder={baseProps.placeholder}
        autoComplete={baseProps.autoComplete}
        autoFocus={baseProps.autoFocus}
        disabled={baseProps.readOnly}
      />
    </FormBase>
  );
}

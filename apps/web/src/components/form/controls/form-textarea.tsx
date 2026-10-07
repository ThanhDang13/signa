import { Textarea } from "@signa/react-ui/components/ui/textarea";
import { FormBase } from "@signa/web/components/form/controls/form-base";
import { useFieldError } from "@signa/web/components/form/hooks/use-field-error";
import { FormControlProps } from "@signa/web/components/form/types";
import { Prettify } from "@signa/web/lib/types";

type FormTextareaControlProps = Prettify<
  FormControlProps & { placeholder?: string; rows?: number; disabled?: boolean }
>;

export function FormTextarea(props: FormTextareaControlProps) {
  const { placeholder, rows, disabled, ...formBaseProps } = props;
  const { field, isInvalid } = useFieldError<string>(props.errorStrategy);

  return (
    <FormBase {...formBaseProps}>
      <Textarea
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
      />
    </FormBase>
  );
}

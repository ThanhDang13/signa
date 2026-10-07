import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@signa/react-ui/components/ui/select";
import { FormBase } from "@signa/web/components/form/controls/form-base";
import { useFieldError } from "@signa/web/components/form/hooks/use-field-error";
import { FormControlProps } from "@signa/web/components/form/types";
import { Prettify } from "@signa/web/lib/types";

export type FormSelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type FormSelectControlProps = Prettify<
  FormControlProps & {
    options: FormSelectOption[];
    placeholder?: string;
    disabled?: boolean;
  }
>;

export function FormSelect(props: FormSelectControlProps) {
  const { options, placeholder, disabled, ...formBaseProps } = props;
  const { field, isInvalid } = useFieldError<string>(props.errorStrategy);

  return (
    <FormBase {...formBaseProps}>
      <Select
        name={field.name}
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value)}
        disabled={disabled}
      >
        <SelectTrigger id={field.name} onBlur={field.handleBlur} aria-invalid={isInvalid}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormBase>
  );
}

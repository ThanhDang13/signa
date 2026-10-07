import { RadioGroup, RadioGroupItem } from "@signa/react-ui/components/ui/radio-group";
import { FieldLabel } from "@signa/react-ui/components/ui/field";
import { FormBase } from "@signa/web/components/form/controls/form-base";
import { useFieldError } from "@signa/web/components/form/hooks/use-field-error";
import { FormControlProps } from "@signa/web/components/form/types";
import { Prettify } from "@signa/web/lib/types";

export type FormRadioOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type FormRadioGroupControlProps = Prettify<
  FormControlProps & { options: FormRadioOption[]; disabled?: boolean }
>;

export function FormRadioGroup(props: FormRadioGroupControlProps) {
  const { options, disabled, ...formBaseProps } = props;
  const { field, isInvalid } = useFieldError<string>(props.errorStrategy);

  return (
    <FormBase {...formBaseProps}>
      <RadioGroup
        name={field.name}
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value)}
        onBlur={field.handleBlur}
        aria-invalid={isInvalid}
        disabled={disabled}
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <RadioGroupItem
              id={`${field.name}-${option.value}`}
              value={option.value}
              disabled={option.disabled}
            />
            <FieldLabel htmlFor={`${field.name}-${option.value}`}>{option.label}</FieldLabel>
          </div>
        ))}
      </RadioGroup>
    </FormBase>
  );
}

import { Button } from "@signa/react-ui/components/ui/button";
import { Input } from "@signa/react-ui/components/ui/input";
import { FormBase } from "@signa/web/components/form/controls/form-base";
import { useFieldError } from "@signa/web/components/form/hooks/use-field-error";
import { FormControlProps } from "@signa/web/components/form/types";
import { Prettify } from "@signa/web/lib/types";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";

type FormPasswordControlProps = Prettify<
  FormControlProps & { placeholder?: string; autoComplete?: string }
>;

export function FormPassword(props: FormPasswordControlProps) {
  const { placeholder, ...formBaseProps } = props;
  const [isVisible, setIsVisible] = useState(false);
  const { field, isInvalid } = useFieldError<string>(props.errorStrategy);

  return (
    <FormBase {...formBaseProps}>
      <div className="relative">
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
          placeholder={placeholder}
          type={isVisible ? "text" : "password"}
          autoComplete={props.autoComplete}
        />
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => setIsVisible((prevState) => !prevState)}
          className="text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
          <span className="sr-only">{isVisible ? "Hide password" : "Show password"}</span>
        </Button>
      </div>
    </FormBase>
  );
}

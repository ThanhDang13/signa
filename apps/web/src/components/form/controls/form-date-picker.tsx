import { Button } from "@signa/react-ui/components/ui/button";
import { Calendar } from "@signa/react-ui/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@signa/react-ui/components/ui/popover";
import { FormBase } from "@signa/web/components/form/controls/form-base";
import { useFieldError } from "@signa/web/components/form/hooks/use-field-error";
import { FormControlProps } from "@signa/web/components/form/types";
import { Prettify } from "@signa/web/lib/types";
import { cn } from "@signa/react-ui/lib/utils";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

type FormDatePickerControlProps = Prettify<
  FormControlProps & {
    placeholder?: string;
    disabled?: boolean;
    dateFormat?: string;
  }
>;

export function FormDatePicker(props: FormDatePickerControlProps) {
  const { placeholder = "Pick a date", disabled, dateFormat = "PPP", ...formBaseProps } = props;
  const { field, isInvalid } = useFieldError<string>(props.errorStrategy);
  const [open, setOpen] = useState(false);

  const selectedDate = field.state.value ? parseISO(field.state.value) : undefined;

  return (
    <FormBase {...formBaseProps}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={field.name}
            type="button"
            variant="outline"
            onBlur={field.handleBlur}
            aria-invalid={isInvalid}
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, dateFormat) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              field.handleChange(date ? date.toISOString() : "");
              setOpen(false);
            }}
            disabled={disabled}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </FormBase>
  );
}

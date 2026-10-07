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
import type { DateRange } from "react-day-picker";

export type FormDateRangeValue = {
  from?: string;
  to?: string;
};

type FormDateRangePickerControlProps = Prettify<
  FormControlProps & {
    placeholder?: string;
    disabled?: boolean;
    dateFormat?: string;
    numberOfMonths?: number;
  }
>;

export function FormDateRangePicker(props: FormDateRangePickerControlProps) {
  const {
    placeholder = "Pick a date range",
    disabled,
    dateFormat = "LLL dd, y",
    numberOfMonths = 2,
    ...formBaseProps
  } = props;
  const { field, isInvalid } = useFieldError<FormDateRangeValue>(props.errorStrategy);
  const [open, setOpen] = useState(false);

  const value = field.state.value;
  const selectedRange: DateRange | undefined = value?.from
    ? {
        from: parseISO(value.from),
        to: value.to ? parseISO(value.to) : undefined
      }
    : undefined;

  const label = selectedRange?.from
    ? selectedRange.to
      ? `${format(selectedRange.from, dateFormat)} - ${format(selectedRange.to, dateFormat)}`
      : format(selectedRange.from, dateFormat)
    : placeholder;

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
              !selectedRange?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={(range) => {
              field.handleChange({
                from: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
                to: range?.to ? format(range.to, "yyyy-MM-dd") : undefined
              });
              if (range?.from && range?.to) setOpen(false);
            }}
            numberOfMonths={numberOfMonths}
            disabled={disabled}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </FormBase>
  );
}

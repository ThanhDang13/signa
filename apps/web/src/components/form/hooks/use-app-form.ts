import { createFormHook } from "@tanstack/react-form";
import { FormInput } from "@signa/web/components/form/controls/form-input";
import { FormPassword } from "@signa/web/components/form/controls/form-password";
import { FormTextarea } from "@signa/web/components/form/controls/form-textarea";
import { FormSelect } from "@signa/web/components/form/controls/form-select";
import { FormCheckbox } from "@signa/web/components/form/controls/form-checkbox";
import { FormSwitch } from "@signa/web/components/form/controls/form-switch";
import { FormRadioGroup } from "@signa/web/components/form/controls/form-radio-group";
import { FormDatePicker } from "@signa/web/components/form/controls/form-date-picker";
import { FormDateRangePicker } from "@signa/web/components/form/controls/form-date-range-picker";
import { SubmitButton } from "@signa/web/components/form/submit-button";
import { Form } from "@signa/web/components/form/form";
import { fieldContext, formContext } from "@signa/web/components/form/hooks/use-form-context";

const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    Input: FormInput,
    Password: FormPassword,
    Textarea: FormTextarea,
    Select: FormSelect,
    Checkbox: FormCheckbox,
    Switch: FormSwitch,
    RadioGroup: FormRadioGroup,
    DatePicker: FormDatePicker,
    DateRangePicker: FormDateRangePicker
  },
  formComponents: { Submit: SubmitButton, Form: Form },
  fieldContext,
  formContext
});

export { useAppForm, withForm };
